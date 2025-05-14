// import { exec } from "child_process";
// import path from "path";
// import fs from "fs";

// export async function executePYCode(code) {

//     return new Promise((resolve) => {


//     const filePath = path.join(process.cwd(), "temp.py");
//     fs.writeFileSync(filePath, code);

//         exec(`python ${filePath}`, (err, stdout, stderr) => {
//             if (err) {
//                 return resolve({ error: stderr || "Execution failed" });
//             }
//             return resolve({ output: stdout.trim() });
//         });
//     });
// }


import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { tmpdir } from "os";

export async function executePYCode(code) {
    return new Promise((resolve) => {
        const timestamp = Date.now();
        const tempDir = tmpdir();  
        const filePath = path.join(tempDir, `temp_${timestamp}.py`);

        // Save the Python script
        fs.writeFileSync(filePath, code);

        const pythonPath = path.join(process.resourcesPath, "compilers/python/python.exe");

        const env = {
            ...process.env,
            PYTHONHOME: path.join(process.resourcesPath, "compilers/python"),
            PYTHONPATH: path.join(process.resourcesPath, "compilers/python/Lib/site-packages"),
            PATH: `${path.dirname(pythonPath)};${process.env.PATH}`
        };

        exec(`"${pythonPath}" "${filePath}"`, { env }, (err, stdout, stderr) => {
            fs.unlinkSync(filePath); 

            if (err) {
                return resolve({ error: stderr || "Execution failed" });
            }
            return resolve({ output: stdout.trim() });
        });
    });
}
