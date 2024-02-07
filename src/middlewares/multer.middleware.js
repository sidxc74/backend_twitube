import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,"./public/temp")
    },
    filename: function (req, file, cb) {
      //can change file name to make it unique
      cb(null, file.originalname)
    }
  })
  
  export const upload = multer({ storage, }) 