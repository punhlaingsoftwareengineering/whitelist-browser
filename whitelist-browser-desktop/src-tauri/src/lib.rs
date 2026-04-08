use serde::Serialize;
use std::fs;
use std::path::PathBuf;

#[derive(Serialize)]
struct DeviceSpec {
  hostname: Option<String>,
  username: Option<String>,
  os: Option<String>,
  os_version: Option<String>,
  arch: Option<String>,
}

#[tauri::command]
fn get_device_spec() -> DeviceSpec {
  // Keep this minimal + cross-platform.
  let hostname = whoami::fallible::hostname().ok();
  let username = Some(whoami::username());
  let os = Some(whoami::platform().to_string());
  let os_version = None;
  let arch = Some(std::env::consts::ARCH.to_string());

  DeviceSpec {
    hostname,
    username,
    os,
    os_version,
    arch,
  }
}

fn storage_file_path() -> Result<PathBuf, String> {
  let dirs = directories::ProjectDirs::from("com", "punhlainghospital", "WhitelistBrowserDesktop")
    .ok_or_else(|| "Could not resolve app data directory".to_string())?;
  let dir = dirs.data_local_dir();
  fs::create_dir_all(dir).map_err(|e| e.to_string())?;
  Ok(dir.join("device_storage.json"))
}

#[tauri::command]
fn wb_storage_load() -> Result<Option<String>, String> {
  let path = storage_file_path()?;
  if !path.exists() {
    return Ok(None);
  }
  fs::read_to_string(&path).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
fn wb_storage_save(json: String) -> Result<(), String> {
  let path = storage_file_path()?;
  fs::write(path, json).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![get_device_spec, wb_storage_load, wb_storage_save])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
