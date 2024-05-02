import { rawMessage } from "../socket/message.js";
import { getCharaInfo } from "../store/chara-info.js";
import { id, req, img_path } from "./neo.js";

export async function recents(target, token, next_token) {
    try {
        const { chat_id } = target.length == 43 ? (await getCharaInfo('chara_id', target)) : (await getCharaInfo('chara' ,target))
        const raw_data = await req(`turns/${chat_id}`, {
            headers: {
                authorization: token,
                'request-id': id()
            },
            searchParams: { next_token }
        }).json()
        const turns = raw_data.turns.map(turn => rawMessage(turn)).reverse()
        return { turns, next_token: raw_data.meta.next_token, statusCode: 200 }
    } catch (e) { 
        return { statusCode: error?.response?.statusCode || 403, message: error?.response?.statusMessage || e }
    }
}

export async function recomendation(events, token) {
    
    try {
        const list_recomendation = ['trending', 'user', 'featured']
        if(!list_recomendation.find(m => m == events))throw `there are no recomendation for ${events}`

        const { characters } = await req(`recommendation/v1/${events}`, {
            headers: {
                authorization: token,
                'request-id': id()
            }
        }).json()
        const chara =  characters.map(chara => {
            return {
                chara_id: chara.external_id,
                name: chara.name,
                interactions: chara.participant__num_interactions,
                title: chara.title,
                greeting: chara.greeting,
                img_url: img_path + chara.avatar_file_name,
                author: chara.user__username,
                translations: chara.translations,
                visibility: chara.visibility
            }
        })
        return { chara, statusCode: 200}
    }
    catch(e) {
        return {statusCode: error?.response?.statusCode || 403, message: error?.response?.statusMessage || e} 
    }
}