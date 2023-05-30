"use client";

import { Context, createContext, useContext, useEffect, useState } from "react"

export type UpdateConfig = (schema: Schema) => void;
export type SettingsContextProps = {
    config: Schema,
    updateConfig: UpdateConfig
}

interface Schema {
    theme: 'dark' | 'light';
    language: 'de' | 'en'
}

export const SettingsContext: Context<SettingsContextProps> = createContext({
    config: {
        language: 'en',
        theme: 'dark'
    },
    updateConfig: (schema) => { return }
})

export const useLanguage = () => useContext(SettingsContext)

// @ts-ignore
export const SettingsProvider = ({ children }) => {
    const [config, setConfig] = useState<Schema>({ language: 'en', theme: 'dark' })

    const updateConfig: UpdateConfig = (schema: Schema) => {
        // @ts-ignore
        const { invoke } = window.__TAURI__.tauri
        console.log("Invoke: ", schema);
        

        invoke("save_config", { content: schema }).then((r: any) => {
            console.log(r);
        });

        setConfig(schema)
    }

    useEffect(() => {
        // @ts-ignore
        const { invoke } = window.__TAURI__.tauri

        const result = invoke("get_config").then((r: any) => {
            setConfig(r)
            console.log("Got new config: ", r);
        })
    }, [])

    return <SettingsContext.Provider value={{ config, updateConfig }}>{children}</SettingsContext.Provider>
}