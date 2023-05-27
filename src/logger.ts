/* eslint-disable @typescript-eslint/restrict-template-expressions */
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
    message: unknown,
    prefix: MessagePrefixes = MessagePrefixes.Debug
  ): void {
    const time: Date = new Date(Date.now());

    const timestamp = `${time.getMonth()}-${time.getDate()}-${time.getFullYear()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}`;

    const output =
      typeof message == 'object'
        ? util.inspect(message, {
            showHidden: false,
            depth: null,
            colors: true,
          })
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
