const router = require("express").Router();
const { Client } = require("@rmp135/imgur");

const client = new Client(require("../config/keys").IMGUR_CLIENT_ID);

router.post("/upload", async (req, res) => {
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

module.exports = router;
