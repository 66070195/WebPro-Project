# WebPro-Project


## วิธีใช้ git

#### วิธี clone (ทำแค่ครั้งแรกครั้งเดียว)
```bash
cd <folderของมึง>
git clone https://github.com/66070195/WebPro-Project.git
git pull
```

#### วิธี push

*git pullก่อนทำงานทุกครั้ง
```bash
cd <folderของโปรเจค>
git add .
git commit -m "งานหมาทำ"
git push
```

#### วิธี merge 
*ใช้git mergeตอนใช้git pullไม่ได้
```bash
git add .  # เพิ่มไฟล์ที่แก้ไขแล้ว
git commit -m "merge"
git merge
```

#### ย้อนเวลา
```bash
git restore
```