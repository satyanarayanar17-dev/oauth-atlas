declare namespace Cloudflare {
  interface Env {
    AI?: import("./lib/research/inference").WorkersModel;
  }
}
