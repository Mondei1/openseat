import { Context, createContext, useContext, useState } from "react"
import { UseTranslationResponse, useTranslation } from "react-i18next"

export type SetLanguage = (i18n: string) => Promise<null>
export type Seti18n = (i18n: UseTranslationResponse<"common", undefined>) => Promise<null>

export type LanguageContextProps = {
    language: string,
    setLanguage: SetLanguage
}

export const LanguageContext: Context<LanguageContextProps> = createContext({
    language: 'en',
    setLanguage: async (language: string) => null,
})

export const useLanguage = () => useContext(LanguageContext)

// @ts-ignore
export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en')
    const [i18n, seti18n] = useState(useTranslation('common'))

    // @ts-ignore: Yeah... I know.
    return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
}