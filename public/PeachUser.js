import apiRequest from "./api.js";

export default class PeachUser {
  constructor(stream) {
    this.getPosts = this.getPosts.bind(this);

    this.fetchedAllPosts = false;

    this.token = stream["token"];
    this.streamID = stream["id"];
    this.postBatches = []
    this.posts = [];

    this.name = null;
    this.displayName = null;
    this.bio = null;
    this.avatarSrc = null;
  }

  populateUserInfo(data) {
    this.name = data["name"];
    this.displayName = data["displayName"];
    this.bio = data["bio"];
    this.avatarSrc = data["avatarSrc"];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getPosts() {
    if (this.fetchedAllPosts) return;

    let cursor = "";
    let [status, data] = await apiRequest("GET", "/stream/id/" + this.streamID, this.token);
    if (status !== 200) throw new Error("Couldn't get stream posts");

    this.populateUserInfo(data["data"]);
    this.postBatches.push(data["data"]["posts"]);

    while (data["data"]["posts"].length > 0) {
      if (!("cursor" in data["data"])) break;
      cursor = data["data"]["cursor"];

      // Sleep for 1s to protect peach's fragile, fragile servers.
      await this.sleep(100);

      [status, data] = await apiRequest("GET", "/stream/id/" + this.streamID + "?cursor=" + cursor, this.token);
      if (status !== 200) throw new Error("Couldn't get stream posts");

      this.postBatches.push(data["data"]["posts"]);
    }

    this.postBatches.reverse().forEach(b => b.forEach(p => this.posts.push(p)));
    this.fetchedAllPosts = true;
  }

  toJSON() {
    return {
      name : this.name,
      displayName : this.displayName,
      bio : this.bio,
      avatarSrc : this.avatarSrc,
      posts : this.posts
    };
  }

  getStatsString(post) {
    let stats = "";
    stats += "🤍 " + post["likeCount"];
    stats += "  💬 " + post["commentCount"];
    let date = new Date(post["createdTime"] * 1000);
    stats += " -- " + date.toDateString();
    return stats;
  }
}