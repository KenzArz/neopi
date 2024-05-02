import { MakeSocket } from "./sock.js";
import { id, config_defaults, language } from "../defaults/neo.js";
import { getCharaInfo } from "../store/chara-info.js";

export class Generate extends MakeSocket {
	constructor(config) {
		super();
		const { payload, author_id, name } = config;
		this.options = payload;
		this.author_id = author_id;
		this.name = name;
	}

	async create_chat({ target }) {
		const chara_id =
			target.length == 43
				? target
				: (await getCharaInfo("chara", target)).chara_id;
		const rawMessage = {
			command: "create_chat",
			request_id: id(chara_id),
			payload: {
				chat: {
					chat_id: id(),
					creator_id: this.author_id,
					visibility: "VISIBILITY_PRIVATE",
					character_id: chara_id,
					type: "TYPE_ONE_ON_ONE",
				},
				with_greeting: true,
			},
			origin_id: "web-next",
		};
		await this.send(rawMessage);
		return rawMessage;
	}

	async create_and_generate_turn({ text, target }) {
		const { chara_id, chat_id } =
			target.length == 43
				? await getCharaInfo("chara_id", target)
				: await getCharaInfo("chara", target);
		const v4 = id();
		const raw_content = {
			command: "create_and_generate_turn",
			request_id: id(chara_id),
			payload: {
				...this.options,
				num_candidates: 1,
				character_id: chara_id,
				previous_annotations: config_defaults.previous_annotations,
				selected_language: config_defaults.selected_language,
				tts_enabled: config_defaults.tts_enabled,
				user_name: this.name,
				turn: {
					turn_key: {
						turn_id: id(), //only this method create new turn_id
						chat_id: chat_id,
					},
					author: {
						author_id: this.author_id,
						is_human: true,
						name: this.name,
					},
					candidates: [
						{
							candidate_id: v4,
							raw_content: text,
						},
					],
					primary_candidate_id: v4,
				},
			},
			origin_id: "web-next",
		};
		await this.send(raw_content);
		return await new Promise(res => this.on("self", res));
	}

	async generate_turn_candidate({ target, turn_key }) {
		const chara_id =
			target.length == 43
				? target
				: (await getCharaInfo("chara", target)).chara_id;
		const newTurn = {
			command: "generate_turn_candidate",
			request_id: id(chara_id),
			payload: {
				character_id: chara_id,
				user_name: this.name,
				previous_annotations: config_defaults.previous_annotations,
				selected_language: config_defaults.selected_language,
				tts_enabled: config_defaults.tts_enabled,
				turn_key, //this turn key is from the AI message that want to regenerate
			},
			origin_id: "web-next",
		};
		await this.send(newTurn);
	}

	async update_primary_candidate({ candidate_id, turn_key }) {
		const update_primary_candidate = {
			command: "update_primary_candidate",
			payload: {
				candidate_id,
				turn_key,
			},
			origin_id: "web-next",
		};
		await this.send(update_primary_candidate);
	}

	async edit_turn_candidate({ text, target, turn_key, candidate_id }) {
		const chara_id =
			target.length == 43
				? target
				: (await getCharaInfo("chara", target)).chara_id;
		const editMessage = {
			command: "edit_turn_candidate",
			request_id: id(chara_id),
			payload: {
				turn_key, //this turn key is from the message that want to be edit ( can from your message or AI message )
				current_candidate_id: candidate_id,
				new_candidate_raw_content: text, // new text that want to replace the old text
			},
			origin_id: "web-next",
		};
		await this.send(editMessage);
		return await new Promise(res => this.on("self", res));
	}

	async remove({ target, turn_ids }) {
		if (turn_ids.length < 1) throw "input turn id to be remove";
		const { chara_id, chat_id } =
			target.length == 43
				? await getCharaInfo("chara_id", target)
				: await getCharaInfo("chara", target);
		const rmv = {
			command: "remove_turns",
			request_id: id(chara_id),
			payload: {
				chat_id,
				turn_ids,
			},
			origin_id: "web-next",
		};
		await this.send(rmv);
	}
}

export default function (config) {
	const { token, author_id, name, lang } = config;
	if (!/Token \w+/.test(token)) return { error: "Token can`t be undefined" };
	if (/[^\d]+/.test(author_id) || Number.isInteger(author_id))
		return { error: "Your id must be a string number" };
	if (isBlankString({ name })) return { error: "Your name can`t be undefined" };

	config_defaults.selected_language =
		language.find(m => m.lang_id == lang)?.lang ||
		config_defaults.selected_language;
	if (!config_defaults.selected_language)
		return { error: "The language you selected is not available" };
	config.payload = config_defaults;

	const socket = new Generate(config);
	socket.connect(token);

	return socket;
}

export function rawMessage(turn, request_id) {
	const chara = {
		chara_name: turn.author.name,
		chara_id: turn.author.author_id,
		is_human: turn.author.is_human || false,
	};
	let candidates;
	if (turn.candidates.length > 1) {
		candidates = [];
		for (const contents of turn.candidates) {
			const content = {
				base_candidate_id: contents.base_candidate_id,
				candidate_id: contents.candidate_id,
				safety_truncated: contents.safety_truncated || false,
				is_new: contents.editor ? true : false,
				is_final: contents.is_final,
				text: contents.raw_content,
			};
			candidates.push(content);
		}
	} else {
		const {
			candidate_id,
			safety_truncated = false,
			raw_content: text,
			editor,
			is_final = false,
		} = turn.candidates[0];
		candidates = {
			candidate_id,
			safety_truncated,
			is_new: editor ? true : false,
			is_final,
			text,
		};
	}
	const contents = {
		turn_key: turn.turn_key,
		state: turn.state,
		chara,
		candidates,
		primary_candidate_id: turn.primary_candidate_id,
	};
	if (request_id) contents.request_id = request_id;
	return contents;
}

export function jsonValidator(text) {
	if (isBlankString({ text })) return false;
	return /^[\],:{}\s]*$/.test(
		text
			.replace(/\\["\\\/bfnrtu]/g, "@")
			.replace(
				/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
				"]"
			)
			.replace(/(?:^|:|,)(?:\s*\[)+/g, "")
	);
}

export function isBlankString(text) {
	for (const i in text) {
		const blank = text[i].trim();
		if (!blank || blank?.length <= 1) return true;
		else if (i + 1 == text.length) return false;
	}
}
