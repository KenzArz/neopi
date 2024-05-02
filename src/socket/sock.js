import { EventEmitter } from 'events'
import WebSocket from 'ws'

import { wsAPI } from '../defaults/neo.js'
import { saveCharaInfo } from '../store/chara-info.js'
import { rawMessage } from './message.js'

export class MakeSocket extends EventEmitter {
  constructor() {
    super()
    this.socket = null
  }

  connect(token) {
    this.socket = new WebSocket(wsAPI, {
      headers: {
        Authorization: token,
        Host: 'neo.character.ai',
        Origin: 'https://beta.character.ai',
        handshakeTimeout: 20000,
        timeout: 20000
      }
    })

    this.socket.setMaxListeners(0)
    const events = ['open','error', 'close', 'upgrade', 'unexpected-response']
    for(const event of events) {
      this.socket.on(event, args => this.emit(event, args))
    }
    
    this.socket.on('message', msg => {
      const { turn, chat, command, comment, error_code, sub_code, request_id } = JSON.parse(msg)
      if(chat)return
      else if(command == 'neo_error') return this.emit('error', {error: comment, statusCode: sub_code || error_code, statusMessage: command})
      else if(command == 'remove_turns_response')return
      else if(turn.author.is_human) return this.emit('self', rawMessage(turn, request_id))
      else if(turn.candidates[0].editor) saveCharaInfo(turn)

      if(turn.candidates[0].is_final && turn.candidates.length == 1) this.emit('message', rawMessage(turn, request_id))
      if(turn.candidates.length > 1) return this.emit('turns-info', rawMessage(turn, request_id))
      this.emit('onmessage', rawMessage(turn, request_id))
    })
  }
  close() {
    if(!this.socket)return
    this.socket.close()
    this.socket = null
  }
  async send(str) { return await new Promise(res => this.socket.send(JSON.stringify(str), res))}
}