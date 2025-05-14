import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { tmpdir } from 'os';


export async function executeCCode(code) {


  return new Promise((resolve) => {
    const filePath = path.join(tmpdir(), `temp_${Date.now()}.c`);
    const outputPath = path.join(tmpdir(), `temp_${Date.now()}.out`);

    fs.writeFileSync(filePath, code);
    exec('gcc --', (err) => {
      const gccPath = err ? path.join(process.resourcesPath, 'compilers/gcc/bin/gcc.exe') : '';
      console.log(gccPath);
      // exec(`gcc ${filePath} -o ${outputPath} && ${outputPath}`, (err, stdout, stderr) => {
      exec(`"${gccPath}" ${filePath} -o ${outputPath} && ${outputPath}`, (err, stdout, stderr) => {
        fs.unlinkSync(filePath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        if (err) {
          return resolve({ error: stderr || 'Compilation failed' });
        }
        return resolve({ output: stdout });
      });
    });
  });
}
