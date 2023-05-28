import axios from "axios";

export class DiscordPoster {
  private urlDiscordProxy: string;
  constructor(urlDiscordProxy: string) {
    this.urlDiscordProxy = urlDiscordProxy;
  }

  async startDiscordThread(title: string, body: string): Promise<boolean> {
    try {
      await axios.post(this.urlDiscordProxy + "/discord/thread/add", {
        Title: title,
        Body: body,
      });

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
