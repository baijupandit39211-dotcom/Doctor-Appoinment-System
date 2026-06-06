import type { UserDocument } from "../models/User.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export {};
