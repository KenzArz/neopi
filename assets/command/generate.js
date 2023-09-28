import { v4 as uuidv4 } from 'uuid';
import pv from 'crypto-js'
import { writeFileSync, readFileSync } from 'fs'

import { recentData, endecRecent } from './recent.js'
const pvk = process.env['xeorcise']

export function create_chat(chara) {
  const { chat_id, chara_id} = getChara(chara)
  const v4 = id()
  const convert = encode(v4)
  updateCharacterData(chara, 'chat_id', convert)
  
  return {
    command: "create_chat",
    request_id: id(chara_id),
    payload: {
        chat: {
            chat_id: v4,
            creator_id: process.env['userId'],
            visibility: "VISIBILITY_PRIVATE",
            character_id: chara_id,
            type: "TYPE_ONE_ON_ONE"
        },
        with_greeting: true
    },
    origin_id: process.env['originId']
  }
}

export function create_and_generate_turn(chara, text, primary) {
  const {chara_id, chat_id} = getChara(chara)
  const Id = decode(chat_id)
  const v4 = id()
  
  const message = {
    command: "create_and_generate_turn",
    request_id: id(chara_id),
    payload: {
        num_candidates: 1,
        character_id: chara_id,
        turn: {
            turn_key: {
                turn_id: v4,
                chat_id: Id
            },
            author: {
                author_id: process.env['userId'],
                is_human: true,
                name: "Masami"
            },
            candidates: [
                {
                    candidate_id: v4, 
                    raw_content: text
                }
            ],
            primary_candidate_id: v4 
        }
    },
    origin_id: process.env['originId']
  }
  if(primary) {
    console.log(primary)
    message.update_primary_candidate = {
      candidate_id: primary.candidate,
      turn_key: {
        chat_id: Id,
        turn_id: primary.key
      }
    }
  }
  storeChat(convertChat(message, chara))
    
  
  return message
}

export function generate_turn_candidate(chara) {
  const {chara_id, chat_id} = getChara(chara)
  const { turn_id } = recentData(chara)[0]
  const Id = decode(chat_id)
              
  const message = {
    command: "generate_turn_candidate",
    request_id: id(chara_id),
    payload: {
        character_id: chara_id,
        turn_key: {
            turn_id,
            chat_id: Id
        }
    },
    origin_id: process.env['originId']
  }
  return message
}

export function remove_turns() {
  
}

export function id(isuuid) {
  if(isuuid)return uuidv4().slice(0, 24) + isuuid.slice(-12)

  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let randomId = ''
  for(let i = 1; i<=5; i++) {
    let limit = 0
    if(i == 1) limit = 8
    else if(i >= 2 && i <= 4) limit = 4
    else if(i == 5) limit = 12

    for(let i = 1; i<= limit; i++){
      const randomCharacters = Math.floor(Math.random() * characters.length)
      randomId += characters.charAt(randomCharacters)
    }
    if(i == 5)continue
    randomId += '-'
  }
  return randomId
}

export function encode(...pvt) {

  const rpv = []
  for(const cvt of pvt) {
    const byt = pv.AES.encrypt(cvt, pvk).toString()
    rpv.push(byt)
  }
  return rpv.length == 1 ? rpv[0] : rpv
}

export function decode(...swt) {
  
  const rdp = []
  for(const dct of swt) {
    const dcp = pv.AES.decrypt(dct, pvk)
    const rlt = dcp.toString(pv.enc.Utf8)

    rdp.push(rlt)
  }
  return rdp.length == 1 ? rdp[0] : rdp
}

export function updateCharacterData(chara, key, value) {
  const characters = listChara()
  const newCharacters = characters.map(data => {
    if(chara == data.chara) {
      data[key] = value
    }
    return data
  })
  writeFileSync('assets/info/charaData.json', JSON.stringify(newCharacters, null, 2))
}

function listChara() {
  const data = readFileSync('assets/info/charaData.json')
  return JSON.parse(data)
  
}

export function getChara(subData) {
  const getData = listChara()
  return getData.find(({chara}) => chara.toLowerCase() == subData.toLowerCase())
}

export function convertChat(message, chara) {
  const pathChara = chara.replaceAll(' ', '_').toLowerCase()
  const temporary = recentData(pathChara)
  const turn = message.turn || message.payload.turn
  console.log(message)

  const candidates = turn.candidates[0],
  content = candidates.raw_content,
  candidateId = candidates.candidate_id,
  turnId = turn.turn_key.turn_id,
  primaryCandidate = turn.primary_candidate_id,
  is_me = turn.author.is_human || false,
  filter = temporary.find((recent) => recent?.turn_id == turnId)

  const [ 
    convertCaId, 
    convertContent,
    convertId,
    convertPrimaryId
        ] = encode(candidateId, content, turnId, primaryCandidate)

  return { 
    convertCaId, 
    convertContent, 
    convertId, 
    convertPrimaryId, 
    is_me,
    pathChara,
    filter,
    temporary
  }
  
}

export function storeChat(convertedChat) {
  const { convertCaId, convertContent, convertId, convertPrimaryId, is_me, pathChara, filter, temporary } = convertedChat
  if(!filter) {
    temporary.forEach(recent => {
      endecRecent(recent, true)
    })
    temporary.unshift({
      candidates: [
        {
          candidate_id: convertCaId,
          raw_content: convertContent
        }
      ],
      turn_id: convertId,
      primary_candidate_id: convertPrimaryId,
      is_me
    }) 
    writeFileSync(`assets/info/recent/${pathChara}.json`, JSON.stringify(temporary, null, 2))
  }
  else if(filter) {
    const turnId = decode(convertId)
    temporary.forEach(recent => {
      if(recent.turn_id == turnId) {
        endecRecent(recent, true)
        recent.candidates.unshift({
          candidate_id: convertCaId,
          raw_content: convertContent
        });
      } else {
        endecRecent(recent, true)
      }
    })
    writeFileSync(`assets/info/recent/${pathChara}.json`, JSON.stringify(temporary, null, 2))
  }
  return console.log('chat has been stored...')
}