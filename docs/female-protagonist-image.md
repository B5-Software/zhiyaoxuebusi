# 女主头像生成记录

工具：内置 imagegen，经 imagegen 技能流程生成。参考：`public/images/student.jpg`，仅作为画风和构图参考。女主是独立人物，不修改男主原图。

游戏使用文件：`public/images/student-female.webp`，640 × 640，WebP quality 88。生成后压缩到游戏目录，男主文件保留。开局选择、人物卡、成长手册、地图和 IM 出发消息共用 `playerPortrait(game)`，性别字段随存档保存。

最终提示词：

> Use case: illustration-story. Asset type: square female protagonist portrait for an existing Chinese high-school simulation game. Input image is STYLE AND FRAMING REFERENCE only: public/images/student.jpg. Create a distinct female protagonist matching this male portrait's exact warm watercolor picture-book chibi aesthetic: large expressive brown eyes, soft pencil outlines, layered watercolor paper texture, warm cream square background with white margin, head and upper body dominating the frame. Female student, dark brown shoulder-length hair with a simple low ponytail, natural smile, blue white tracksuit school uniform with a small red stripe, dark backpack, holding a plain yellow notebook with both hands. Match scale, lighting, cozy warm beige muted blue palette and portrait framing of reference. One character only. No text, no logos, no watermark, no border decorations. A regular nonsexual school avatar illustration, not a photograph.
