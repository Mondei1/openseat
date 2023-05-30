use std::{process::exit, fs, path::PathBuf, io};

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct Content {
    pub(crate) version: u16,
    pub(crate) language: String,
    pub(crate) theme: String
}

pub struct Config {
    content: Content,
    path: PathBuf
}

const CURRENT_CONFIG_VERSION: u16 = 1;

impl Config {
    pub fn new(path: PathBuf) -> Self {
        // Ensure config exists
        if path.exists() {
            // Try to read config file
            let raw_content = match fs::read_to_string(&path) {
                Ok(rc) => rc,
                Err(err) => {
                    println!("Config file cannot be opened: {}", err);

                    exit(1);
                }
            };

            let content: Content = match serde_json::from_str(&raw_content) {
                Ok(c) => c,
                Err(err) => {
                    println!("Config file has invalid syntax: {}", err);

                    exit(1);
                }
            };

            if content.version > CURRENT_CONFIG_VERSION {
                println!("Your config file appears to be from a newer version. Refuse to load.");
                exit(1);
            }

            Self { content, path }
        } else {
            // Config doesn't exist
            let content = Content {
                version: 1,
                language: "en".to_string(),
                theme: "dark".to_string()
            };

            let instance = Self { content, path };
            instance.write(&instance.content);

            instance
        }
    }

    pub fn write(&self, content: &Content) -> Result<(), io::Error> {
        let formatted_config = match serde_json::to_string(content) {
            Ok(fc) => fc,
            Err(err) => {
                println!("Cannot deserialize config: {}", err);

                exit(1);
            }
        };

        let mut path_clone = self.path.clone();
        path_clone.pop();

        // Make sure all dirs exist in path.
        if !path_clone.exists() {
            match fs::create_dir_all(path_clone) {
                Ok(_) => {},
                Err(err) => {
                    println!("Failed to create all dirs in path: {}", err);
                    exit(1);
                }
            }
        }

        // Write config to disk
        match fs::write(&self.path, formatted_config) {
            Ok(_) => { Ok(()) }
            Err(err) => {
                println!(
                    "Cannot write config file to {}: {}",
                    &self.path.to_str().unwrap(),
                    err
                );

                Err(err)
            }
        }
    }

    pub fn get_content(&self) -> &Content {
        &self.content
    }
}