import {neopi} from '../socket/message.js'

/**
 * @typedef {object} candidates
 * @prop {string} candidates.candidate_id,
 * @prop {boolean} candidates.safety_truncated
 * @prop {boolean} candidates.is_new
 * @prop {boolean} candidates.is_final
 * @prop {string} candidates.text 
 */

 /**
 * @typedef {Object} neo
 * @prop {object} turn_key 
 * @prop {string} turn_key.turn_id 
 * @prop {string} turn_key.chat_id
 * 
 * @prop {Object} chara
 * @prop {string} chara.chara_name
 * @prop {string} chara.chara_id
 * @prop {boolean} chara.is_human
 * 
 * @prop {candidates | candidates[]} candidates
 * 
 * @prop {string} state
 * @prop {string} primary_candidate_id
 * @prop {string} request_id
*/


/** 
 * @typedef {object} config
 * @prop {string} config.token
 * @prop {string} config.author_id
 * @prop {string} config.name
 * @prop {string} config.lang
*/
