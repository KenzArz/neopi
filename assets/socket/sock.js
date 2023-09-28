import WebSocket from 'ws'
import { writeFileSync } from 'fs'
import { convertChat, storeChat } from '../command/generate.js'
import { sending } from '../../app.js'

const client = new WebSocket(process.env['neopi'], {
  headers: {
    authorization: process.env['token'],
    'Sec-WebSocket-Key': 'V/ILw84lAzlS86OW7Gfl4g==',
    'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
    'user-agent': 'CharacterAI/1.0.0 (iPhone; iOS 14.4.2; Scale/3.00)'
  }
})

client.setMaxListeners(0)
client.on('open', () => {
  console.log('open websocket....')
})


export function clients(message, chara) {
  // client.on('open', () => {
    // console.log('conected.........')
  client.send(message)
  // })
}

let contentRaw;
  client.on('message', msg => {
    const parse  = JSON.parse(msg)
    if(parse?.turn?.candidates[0]?.editor) {
      const chara = parse?.turn?.author?.name
      const recentPath = 'src/info/recent/'+ chara.replaceAll(' ', '_').toLowerCase() + '.json'
      writeFileSync(recentPath, "[]")
    }
    else if(parse.command == 'update_turn' && parse?.turn?.candidates[0]?.is_final) {
      storeChat(convertChat(parse, parse.turn.author.name))
      const candidates = parse.turn.candidates[0]
      const content = candidates.raw_content
      const candidate_id = candidates.candidate_id
      const turn_id = parse.turn.turn_key.turn_id
      const primary_candidate_id = parse.turn.primary_candidate_id
      sending({
        content,
        candidate_id,
        turn_id,
        primary_candidate_id
        })
       
    }
    console.log(JSON.stringify(parse, null, 2))
  })
