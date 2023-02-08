const router = require("express").Router();
const { Client } = require("@rmp135/imgur");
const { Storage } = require("megajs");

const client = new Client(require("../config/keys").IMGUR_CLIENT_ID);

const storage = new Storage(
  {
    email: "nikkhatwani@gmail.com",
    password: "clubverseIsAmazing",
    userAgent: "ExampleClient/1.0",
  },
  (error) => {
    if (error) {
    } else {
    }
  }
);

storage.once("ready", () => {
  console.log("[File Upload Manager] Ready");
});

storage.once("error", (error) => {
  console.log("[File Upload Manager] Error", error);
});

router.post("/upload/images", async (req, res) => {
  const { images } = req.body;

  try {
    const promises = images.map(async (image) => {
      const getTypeOfImage = (img) => {
        let url;
        try {
          url = new URL(img);
        } catch (err) {
          return "base64";
        }

        if (url.protocol === "https:" || url.protocol === "http:") {
          return "url";
        }
      };

      const response = await client.Image.upload(image, {
        type: getTypeOfImage(image),
      });

      const { link } = response.data;
      return link;
    });

    const responses = await Promise.all(promises);
    return res.json({
      success: true,
      images: responses,
    });
  } catch (e) {
    console.log(e);
    return res.json({
      success: false,
      message: "Server Error",
    });
  }
});

router.post("/upload/file", async (req, res) => {
  if (!storage.ready) {
    await new Promise((resolve) => storage.once("ready", resolve));
  }

  const file = await storage.upload(
    req.body.name,
    Buffer.from(req.body.content, "base64")
  ).complete;

  const link = await file.link();

  console.log(file);

  return res.json({
    link,
    name: file.name,
    size: file.size,
    success: true,
  });
});

module.exports = router;
