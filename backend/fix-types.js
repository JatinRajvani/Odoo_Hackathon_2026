const fs = require('fs');
const files = [
  'src/controllers/driver.controller.ts',
  'src/controllers/maintenance.controller.ts',
  'src/controllers/trip.controller.ts',
  'src/controllers/vehicle.controller.ts'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/const { id } = req\.params;/g, "const id = req.params.id as string;");
  content = content.replace(/status: String\(status\)/g, "status: status as any");
  content = content.replace(/\.\.\.\(status && \{ status \}\)/g, "...(status && { status: status as any })");
  content = content.replace(/where: \{ id \}/g, "where: { id: id as string }");
  content = content.replace(/const filter = status \? \{ status: String\(status\) \} : \{\};/g, "const filter: any = status ? { status: status as any } : {};");
  fs.writeFileSync(f, content);
});
console.log('Types fixed!');
