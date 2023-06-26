#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
mod config;

use std::path::PathBuf;

use crate::config::{Config, Content};
use once_cell::sync::Lazy;
use tauri::{api::path::config_dir, Manager};

static CONFIG: Lazy<Config> = Lazy::new(|| {
  let path = format!("{}/openseat/config.json", config_dir().unwrap().to_str().unwrap());

  Config::new(PathBuf::from(path))
});

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let _ = app.get_window("main").unwrap();
      
      Ok(())
    })
    .plugin(tauri_plugin_sql::Builder::default().build())
    .invoke_handler(tauri::generate_handler![get_config, save_config, open_github])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn open_github() {
  let _ = open::that("https://github.com/Mondei1/openseat");
}

#[tauri::command]
fn get_config() -> Content {
  CONFIG.get_content().clone()
}

#[tauri::command]
fn save_config(content: Content) -> bool {
  match CONFIG.write(&content) {
    Ok(_) => { true },
    Err(err) => {
      println!("Saving of config failed: {}", err);
      false
    }
  }
}