import apiRequest from "./api.js";
import PeachUser from "./PeachUser.js";

class App {
  constructor() {
    this.save = this.save.bind(this);
    this.login = this.login.bind(this);
    this.displayPost = this.displayPost.bind(this);
    this.displayComment = this.displayComment.bind(this);
    this.addPostContent = this.addPostContent.bind(this);
    this.jsonDownload = this.jsonDownload.bind(this);
    this.htmlDownload = this.htmlDownload.bind(this);

    this.user = null;
  }

  setup() {
    document.querySelector("#loginFieldsForm").addEventListener("submit", this.login);
    document.querySelector("#jsonDownload").addEventListener("click", this.jsonDownload);
    document.querySelector("#htmlDownload").addEventListener("click", this.htmlDownload);    
  }

  async login(event) {
    event.preventDefault();

    let elements = document.querySelector("#loginFieldsForm").elements;
    let email = elements.namedItem("email").value;
    let password = elements.namedItem("password").value;
    let [status, data] = await apiRequest("POST", "/login", null, { email, password });
    if (status !== 200) throw new Error("Couldn't log in");

    if (data["success"] !== 1) {
      document.querySelector("#error").innerHTML = "Error: Incorrect username/password";
      return;
    }

    /* Success! We're logged in. */
    this.user = new PeachUser(data["data"]["streams"][0]);

    document.querySelector("#error").innerHTML = "";
    document.querySelector("#loginFieldsForm").classList.add("hidden");
    document.querySelector("#downloadForm").classList.remove("hidden");
  }

  async jsonDownload() {
    await this.user.getPosts();
    let userJSON = this.user.toJSON();
    this.save(userJSON["name"] + ".json", JSON.stringify(userJSON, null, 2));
  }

  displayComment(parent, comment) {
    let node = parent.querySelector("#templateComment").cloneNode(true);
    node.id = "";
    node.classList.remove("hidden");

    let avatar = node.querySelector(".avatar");
    avatar.src = comment["author"]["avatarSrc"];
    avatar.alt = `${comment["author"]["displayName"]}'s avatar`;

    node.querySelector(".name").textContent = comment["author"]["displayName"];
    node.querySelector(".userid").textContent = "@" + comment["author"]["name"];
    node.querySelector(".commentText").textContent = comment["body"];
    parent.appendChild(node);
  }

  addPostContent(parent, post) {
    /* Chain together all the individual parts of the message */
    for (let i = 0; i < post["message"].length; ++i) {
      let m = post["message"][i];
      let messagePart = parent.cloneNode(true);
      messagePart.classList.add("post");
      messagePart.textContent = "";
      messagePart.id = "";

      switch(m["type"]) {
        case "image":
          messagePart = document.createElement('img');
          messagePart.src = m["src"];
          messagePart.classList.add("post");
          break;
        case "music":
          messagePart.textContent = m["title"];
          break;
        case "link":
          messagePart = document.createElement('a');
          messagePart.href = m["url"];
          messagePart.textContent = m["url"];
          break;
        case "location":
          m['formattedAddress'].forEach(a => messagePart.textContent += a + " ");
          break;
        case "gif":
          messagePart = document.createElement('img');
          messagePart.src = m["src"];
          messagePart.classList.add("post");
          break;
        case "text":
          messagePart.textContent = m["text"];
          break;
        case "video":
          messagePart = document.createElement('a');
          messagePart.href = m["url"];
          messagePart.textContent = m["url"];
      }

      parent.appendChild(messagePart);
    }
  }

  displayPost(post) {
    let node = document.querySelector("#templatePost").cloneNode(true);
    node.id = "";

    this.addPostContent(node.querySelector("#postParent"), post);    
    node.querySelector(".postStats").textContent = this.user.getStatsString(post);
    if (post["commentCount"] > 0) post["comments"].forEach(c => this.displayComment(node, c));

    node.classList.remove("hidden");
    node.querySelector("#templateComment").remove();
    document.querySelector("#feed").appendChild(node);
  }

  async htmlDownload(event) {
    event.preventDefault();

    document.querySelector("#downloadForm").classList.add("hidden");
    document.querySelector("#header").classList.add("hidden");
    document.querySelector("#feed").classList.remove("hidden");

    await this.user.getPosts();
    document.querySelector("#numPosts").textContent = "Total Posts: " + this.user.posts.length;
    document.querySelector("#username").textContent = this.user.name;
    document.querySelector("#bio").textContent = this.user.bio;
    document.querySelector("#userAvatar").src = this.user.avatarSrc;
    this.user.posts.forEach(p => this.displayPost(p));
  }

  save(filename = null, data = null) {
    if (filename === null) filename = "default.txt";

    var blob = new Blob([data], {type: 'text/csv'});
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, filename);
    }
    else {
      var elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;        
      document.body.appendChild(elem);
      elem.click();        
      document.body.removeChild(elem);
    }
  }
}

let app = new App();
app.setup();

