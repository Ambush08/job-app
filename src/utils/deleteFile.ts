import fs from "fs";

export const deleteFromLocal = async (filePath: string) => {
  await fs.promises.unlink(filePath);
};

export default deleteFromLocal;