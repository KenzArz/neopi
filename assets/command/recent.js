import fetch from 'node-fetch'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { encode, decode, getChara, id } from './generate.js'

export async function recent(chara) {

  const valRecent = recentData(chara),
  { chat_id } = getChara(chara.replaceAll('_', ' ')),
    v4Id = decode(chat_id),
    fetchRecent = await fetch(`https://neo.character.ai/turns/${v4Id}`, {
    headers: {
      authorization: process.env['token'],
      'user-agent': "CharacterAI/1.0.0 (iPhone; iOS 14.4.2; Scale/3.00)",
      origin: 'https://beta.character.ai',
      'origin-id': process.env['originId'],
      'request-id': id()
    },
    method: 'GET'
  })
  if(fetchRecent.status !== 200) throw 'error'
  
  const { turns } = await fetchRecent.json(),
    filTurns = turns.map(extend =>  {
    return {
      turn_id: extend.turn_key.turn_id,
      primary_candidate_id: extend.primary_candidate_id,
      is_me: extend.author.is_human || false,
      candidates: extend.candidates.map(candidate => {
        return {
          candidate_id: candidate.candidate_id,
          raw_content: candidate.raw_content
        }
      })
    }
  }),
    
    combinedRecent = [...filTurns,...valRecent],
    uniqueCombinedRecent = combinedRecent.filter((item, index, self) => {
      return self.findIndex(t => t?.turn_id == item?.turn_id) === index;
    }),
    
    convertedRecent = uniqueCombinedRecent.map(turns => {
      endecRecent(turns, true)
    return turns
  })
  
  writeFileSync(`assets/info/recent/${chara.replaceAll(' ', "_").toLowerCase()}.json`, JSON.stringify(convertedRecent, null, 2))
    }


export function recentData(chara) {
  const recentPath = `assets/info/recent/${chara.replaceAll(' ', '_').toLowerCase()}.json`
    
  const recentFile = existsSync(recentPath)
  if(!recentFile) writeFileSync(recentPath, "[]")
  
  const recent = readFileSync(recentPath)
  const v4 = JSON.parse(recent)
  return v4.map(turns => {
    endecRecent(turns, false)
    return turns
  })
}

export function endecRecent (recent, isEncode) {

  if(isEncode) {
    for (const prop in recent) {
      if (prop === 'candidates') {
        recent[prop].forEach(candidate => {
          for (const extend in candidate) {
            candidate[extend] = encode(candidate[extend]);
          }
        });  
      } else if (prop !== 'is_me') {
        recent[prop] = encode(recent[prop]);
      }
    }
  } else {
    for (const prop in recent) {
      if (prop === 'candidates') {
        recent[prop].forEach(candidate => {
          for (const extend in candidate) {
            candidate[extend] = decode(candidate[extend]);
          }
        });  
      } else if (prop !== 'is_me') {
        recent[prop] = decode(recent[prop]);
      }
    }
  }
}
  
  