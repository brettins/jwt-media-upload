import axios from "axios";

import i18n from '@/i18n'

import { bytesToMegabytes } from "@/helpers/conversions"

export default async function (fileEvent, jwt, maxSize, requirements = {}) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      const file = fileEvent.target.files[0]
      if (file) {
        reader.readAsDataURL(file);
        if (maxSize && file.size > maxSize) {
          let error = new Error(i18n.t('forms.fileTooLarge', { size: bytesToMegabytes(maxSize, 0) }));
          error.name = "FileTooLargeError"
          return reject(error)
        }
        reader.onload = async () => {
          if (requirements.minHeight && requirements.minWidth) {
            var img = new Image
            img.src = reader.result;
            try {
              await img.decode()
              if (img.height < requirements.minHeight || img.width < requirements.minWidth) {
                return reject(new Error(i18n.t('forms.imageDimensionsError', { minHeight: requirements.minHeight, minWidth: requirements.minWidth })))
              }
            } catch (error) {
              return reject(new Error(error))
            }
          }

          try {
            let bodyFormData = new FormData();
            bodyFormData.append("file", file);
            if (requirements.bodyFormData) {
              for (const property in requirements.bodyFormData) {
                bodyFormData.append(property, requirements.bodyFormData[property]);
              }
            }
            let headers = {
              "Content-Type": "multipart/form-data",
            }
            if (jwt) {
              headers.Authorization = "Bearer " + jwt
            }
            let response = await axios.post(
              process.env.VUE_APP_SERVER_HOST + "/media_objects",
              bodyFormData,
              {
                headers: headers,
              }
            );
            resolve(response)
          } catch (err) {
            return reject(err)
          }
        }
      }
      else {
        return reject()
      }
    } catch (err) {
      return reject(err)
    }
  })
}
