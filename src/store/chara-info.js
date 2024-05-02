import { readFile, writeFileSync, mkdirSync } from 'fs'

/**
 * @param {{author: { author_id: string, name: string }, turn_key: { chat_id: string } } }
 */
export async function saveCharaInfo({ author: { author_id: chara_id, name: chara }, turn_key: { chat_id } }) {
    const charaInfo = { chara, chara_id, chat_id }
    const path = './info/charaInfo.json'

    //check if the file exists
    const readInfo = await readCharaInfo(path)
    const content = readInfo || [charaInfo]
    //check if there any 
    const duplicate = content?.find(k => k.chara_id == chara_id)
    
    //if the file has not been created
    if(!readInfo) mkdirSync('./info/', {recursive: true})
    //if the content already exists, change the chat_id to the newest one
    else if(duplicate) duplicate.chat_id = chat_id
    //if the file has been created
    else content.push(charaInfo)

    const toJson = JSON.stringify(content, null, 2)
    writeFileSync(path, toJson)
}
/**
 * @param {string} path - a path about chara information  
 * @returns {Promise<{chara: string, chara_id: string, chat_id: string}[]>} arrray of object that contain about character informations
 * */
export const readCharaInfo = async (path = './info/charaInfo.json') => new Promise(res => readFile(path, 'utf8', (e, data) => res(data ? JSON.parse(data) : undefined)))
/**
 * @param {string} chara_id
 * @returns {Promise<{chara: string, chara_id: string, chat_id: string}>} an object that contain about character informations
 */
export const getCharaInfo = async (type, target) => {
    const charaInfo = await readCharaInfo()
    const character = charaInfo.find(data => data[type].toLowerCase() == target.toLowerCase())
    if(!character)throw 'the characater name is not available in database!'
    return character
}