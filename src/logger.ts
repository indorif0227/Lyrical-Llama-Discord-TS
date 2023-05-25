import util from 'util';

export enum MessagePrefixes {
	Success = '+',
	Failure = 'x',
	Neutral = '=',
	Warning = '!',
	Debug = '%',
}

class Logger {
	private static instance: Logger;

	public write(
		message: any,
		prefix: MessagePrefixes = MessagePrefixes.Debug,
		isObject: boolean = false
	): void {
		const time: Date = new Date(Date.now());

		const timestamp: string = `${time.getMonth()}-${time.getDate()}-${time.getFullYear()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}`;

		const output = isObject
			? util.inspect(message, { showHidden: false, depth: null, colors: true })
			: message;

		console.log(`[${prefix}][${timestamp}] ${output}`);
	}

	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}
}

export const logger = Logger.getInstance();
