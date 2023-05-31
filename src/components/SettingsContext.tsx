"use client";

import { Context, createContext, useContext, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next";

export type UpdateConfig = (schema: Schema) => void;
export type ReadConfig = () => void;
export type SettingsContextProps = {
    config: Schema,
    updateConfig: UpdateConfig,
    readConfig: ReadConfig
}

interface Schema {
    theme: 'dark' | 'light';
    language: 'de' | 'en'
}

// @ts-ignore: I've got no idea why TS is complaining here but it works.
export const SettingsContext: Context<SettingsContextProps> = createContext({
    config: {
        language: 'en',
        theme: 'dark'
    },
    updateConfig: (schema) => { return },
    readConfig: () => { }
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
            console.debug("Config has been saved.");
        });

        setConfig(schema)
    }

    const readConfig: ReadConfig = () => {
        // @ts-ignore
        const { invoke } = window.__TAURI__.tauri

        const result = invoke("get_config").then((r: any) => {
            setConfig(r)
            console.log("Got new config: ", r);
        })
    }

    useEffect(() => {
        readConfig()
    }, [])

    return <SettingsContext.Provider value={{ config, updateConfig, readConfig }}>{children}</SettingsContext.Provider>
}