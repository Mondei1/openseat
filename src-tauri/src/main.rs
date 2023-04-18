#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::Theme;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}