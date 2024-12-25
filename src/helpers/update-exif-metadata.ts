import { exiftool } from 'exiftool-vendored';
import { doesFileSupportExif } from './does-file-support-exif';
import { promises as fspromises } from 'fs';
import { MediaFileInfo } from '../models/media-file-info';
import { resolve } from 'path';
import { renameSync, existsSync } from 'fs';

const { unlink, copyFile } = fspromises;

export async function updateExifMetadata(fileInfo: MediaFileInfo, timeTaken: string, errorDir: string): Promise<string> {
  if (!doesFileSupportExif(fileInfo.outputFilePath)) {
    return "";
  }

  try {
    console.log(timeTaken);
    await exiftool.write(fileInfo.outputFilePath, {
      DateTimeOriginal: timeTaken,
    });
    console.log("after"); 
    console.log(timeTaken);
  
    await unlink(`${fileInfo.outputFilePath}_original`); // exiftool will rename the old file to {filename}_original, we can delete that

  } catch (error) {
    let message;
    if (error instanceof Error) message = error.message
    else message = String(error)
    if(message)
    {
      if(message.includes("valid PNG"))
      {
        if(fileInfo.outputFilePath.split('.').pop()?.toString().toLowerCase() === "png")
        {
          console.log("Renaming:");
          let newFile = fileInfo.outputFilePath.slice(0, -3) + "jpg";
          renameSync(fileInfo.outputFilePath, newFile);
          await exiftool.write(newFile, {
            DateTimeOriginal: timeTaken,
          });
          await unlink(`${newFile}_original`);
          if(existsSync(fileInfo.outputFilePath))
          {
            await unlink(fileInfo.outputFilePath);
          }
          return newFile;
        }
      }
      else if(message.includes("Truncated"))
      {

      }
    }
    console.log(error)
    await copyFile(fileInfo.outputFilePath,  resolve(errorDir, fileInfo.mediaFileName));
    if (fileInfo.jsonFileExists && fileInfo.jsonFileName && fileInfo.jsonFilePath) {
      await copyFile(fileInfo.jsonFilePath, resolve(errorDir, fileInfo.jsonFileName));
    }
  }
  return "";
}
