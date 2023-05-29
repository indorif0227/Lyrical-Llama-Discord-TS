import { AudioResource } from "@discordjs/voice";
import { InfoData } from "play-dl";

export type Song = { info: InfoData; audio: AudioResource };
