import got from 'got'
import { v4 as uuidv4 } from 'uuid'
/**@type string websocket url */
export const wsAPI = 'wss://neo.character.ai/ws/'
export const img_path = 'https://characterai.io/i/400/static/avatars/'

/**@type string API content */
export const req = got.extend({
    prefixUrl: 'https://neo.character.ai/', 
    headers: {
        origin: 'https://beta.character.ai',
        referer: 'https://beta.character.ai/'
    },
    timeout: {
        connect: 3000,
        request: 5000,
        response: 5000,
        socket: 4000,
        send: 5000,
        secureConnect: 5000,
        read: 5000,
        lookup: 5000,
    }
})

/**
 * @param {string} charaId
 * @return returns the request id or chat id in the form of a string
 */
export const id = charaId => charaId ? uuidv4().slice(0, 24) + charaId.slice(-12) : uuidv4()

export const config_defaults = {
    previous_annotations: {
        boring: 0,
        not_boring: 0,
        inaccurate: 0,
        not_inaccurate: 0,
        repetitive: 0,
        not_repetitive: 0,
        out_of_character: 0,
        not_out_of_character: 0,
        bad_memory: 0,
        not_bad_memory: 0,
        long: 0,
        not_long: 0,
        short: 0,
        not_short: 0,
        ends_chat_early: 0,
        not_ends_chat_early: 0,
        funny: 0,
        not_funny: 0,
        interesting: 0,
        not_interesting: 0,
        helpful: 0,
        not_helpful: 0
    },
    tts_enabled: false,
    selected_language: "English", //default value
}
export const language = [
    { lang: 'English', lang_id: 'US' }, 
    { lang: 'Español', lang_id: 'ES' },
    { lang: 'Français', lang_id: 'FR' },
    { lang: 'Italiano', lang_id: 'IT' },
    { lang: 'Português', lang_id: 'PT' },
    { lang: 'Português (BR)', lang_id: 'BR' },
    { lang: 'Deutsch', lang_id: 'DE' },
    { lang: 'Türkçe', lang_id: 'TR' },
    { lang: 'Polski', lang_id: 'PL' },
    { lang: 'Русский', lang_id: 'RU' },
    { lang: '中文', lang_id: 'CN' },
    { lang: '繁體中文', lang_id: 'TW' },
    { lang: '日本語', lang_id: 'JP' },
    { lang: '한국인', lang_id: 'KR' },
    { lang: 'Bahasa Indonesia', lang_id: 'ID' },
    { lang: 'ไทย', lang_id: 'TH' },
    { lang: 'Tiếng Việt', lang_id: 'VN' },
    { lang: 'Български', lang_id: 'BG' },
    { lang: 'Čeština', lang_id: 'CZ' },
    { lang: 'Ελληνικά', lang_id: 'GR' },
    { lang: 'Suomi', lang_id: 'FI' },
    { lang: 'हिन्दी', lang_id: 'IN' },
    { lang: 'Hrvatski', lang_id: 'HR' },
    { lang: 'Magyar', lang_id: 'HU' },
    { lang: 'Lietuvių', lang_id: 'LT' },
    { lang: 'Nederlands', lang_id: 'NL' },
    { lang: 'Română', lang_id: 'RO' },
    { lang: 'Svenska', lang_id: 'SE' },
    { lang: 'Українська', lang_id: 'UA' }
]