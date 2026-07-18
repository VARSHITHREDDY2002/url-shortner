import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../index.js";
import db from "../db/index.js";

beforeEach(() => {
    db.prepare("DELETE FROM links").run();
});

describe("POST /shorten", () => {

    it("creates a short url", async () => {

        const res = await request(app)
            .post("/shorten")
            .send({
                url: "https://google.com"
            });

        expect(res.status).toBe(201);
        expect(res.body.code).toBeDefined();
        expect(res.body.url).toBe("https://google.com");
    });

    it("returns 400 for invalid url", async () => {

        const res = await request(app)
            .post("/shorten")
            .send({
                url: "abcd"
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid URL");
    });

    it("creates custom alias", async () => {

        const res = await request(app)
            .post("/shorten")
            .send({
                url: "https://github.com",
                customalias: "github"
            });

        expect(res.status).toBe(201);
        expect(res.body.code).toBe("github");
    });

    it("returns 409 when alias already exists", async () => {

        await request(app)
            .post("/shorten")
            .send({
                url: "https://google.com",
                customalias: "google"
            });

        const res = await request(app)
            .post("/shorten")
            .send({
                url: "https://facebook.com",
                customalias: "google"
            });

        expect(res.status).toBe(409);
    });

    it("returns existing short code for duplicate url", async () => {

        const first = await request(app)
            .post("/shorten")
            .send({
                url: "https://google.com"
            });

        const second = await request(app)
            .post("/shorten")
            .send({
                url: "https://google.com"
            });

        expect(second.status).toBe(200);
        expect(second.body.code).toBe(first.body.code);
    });

});

describe("GET /:code", () => {

    it("redirects to original url", async () => {

        const created = await request(app)
            .post("/shorten")
            .send({
                url: "https://google.com"
            });

        const res = await request(app)
            .get(`/${created.body.code}`);

        expect(res.status).toBe(301);
        expect(res.headers.location).toBe("https://google.com");
    });

    it("returns 404 for unknown code", async () => {

        const res = await request(app)
            .get("/does-not-exist");

        expect(res.status).toBe(404);
    });

});