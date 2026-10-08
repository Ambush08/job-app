import fs from 'fs';


export const deleteFromLocal = async (filePath: string) => {
    await fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Error deleting file ${filePath}:`, err);
        } else {
            console.log(`File ${filePath} deleted successfully.`);
        }
    });
};

export default deleteFromLocal;