# v2.7.0：心事与成年内容设置

## 已实现

- 首次进入强制选择玩家是否满 18 岁，未知状态按普通内容处理。选择与跳过偏好使用独立浏览器键 `shiguang-audience-v1`；导入、读取、新开游戏均不改变该偏好。
- 主角与五位可攻略角色有固定生日，故事开场均满 18 岁；角色年龄与玩家年龄分别判断。所有成人向入口同时检查玩家设置与角色年龄。
- IM 和关系卡片提供「心事 · 恋爱界面」「主动表白」。表白需要信任 60、心动 55、了解 30、两个不同游戏周的见面，以及专属约见或心事回复。未满足条件展示缺项；暂缓或重新考虑至少等待三周。
- 专属界面含「我们」「相处」「约定」「回忆」。五条路线各有六段不同的恋爱剧情，共 30 段，依次解锁且相邻章节至少间隔一周。
- 散步、约会、回家做客、认真沟通各消耗一次行动。牵手、拥抱与轻吻需要双方愿意，亲近每周记录一次，避免重复刷数值。
- 恋人同行跨地图跟随，每位角色只有一个标记。其他同学、妈妈与老师按周次与行动时段出现在不同地点；已接受的约见覆盖普通日程。周末结束同行与来访。
- 邀请回家包含明确同意、客厅读书与音乐、家人共餐、结束来访。成年玩家在满足条件后才看到私人时间入口。首次提示 NSFW，可进入非露骨转场或直接跳过；两种选择的收益与消耗相同。本次确认只存在于内存中，刷新必须重新确认。
- 冷静期保留恋爱关系并暂停跟随、来访与亲近。分手取消旧约见、保留回忆与项目进度。分开至少三周且沟通过后，可以重新主动表白，建立新的关系阶段。
- 普通礼物保留偏好与每周一次限制。手工纪念册消耗一份手帐材料，再跨三个不同游戏周各投入一次行动，完成后送出，不能重复领取。
- 新增五条恋爱专属长期任务，每条四阶段、至少六周、六次投入，同时要求真实专属剧情。冷静与分手暂停进度，完成后的奖励保留。
- 老师关注、家人担心、同学议论分别记录。公开亲近或来访可能引起关注；时间与信任提供缓冲。关心事件排在每周故事之后，不覆盖未完成剧情，至少间隔两周。
- 新增两张水彩恋爱三联画（男女与男生情侣版本），表现成年情侣牵手、拥抱和轻吻；插画用于相处界面。私密剧情仅用灯光与转场，不制作性行为过程图。

## 存档与入口

游戏数据结构升级至 v3，沿用旧自动存档和槽位键，以免旧进度丢失。v1 / v2 自动迁移，保留姓名、聊天、已完成事件、关系与长期项目。v3 增加角色相处周次、边界、回忆、来访、跟随、关注与当前地图坐标。导入仅复制已知字段，不接受用户年龄或剧情确认。

入口：底部消息 → 联系人 → 心事；所有关系 → 角色卡片 → 心事；恋爱后的陪伴头像展开后 → 我们的故事；有恋爱章节的地点页也提供跳转。成人向特殊入口对未知或未成年玩家直接隐藏。

## 美术生成记录

使用内置 imagegen 工具（未指定或宣称扩散模型架构）。最终素材：`public/images/romance-moments.webp` 与 `public/images/romance-men-moments.webp`。原始输出为三联画，转换为 WebP 后随游戏部署。

最终提示词：

> Use case: illustration-story. Create a polished three-panel horizontal triptych for an adult romance life simulation, each panel separated by a soft cream watercolor margin. All people clearly adults aged 25 with mature facial features, ordinary casual clothing, fully clothed. Panel 1: an adult couple holding hands on a shaded riverside walk in Xi'an at sunset. Panel 2: the same couple sharing a gentle affectionate hug in a cozy living room, fully clothed. Panel 3: the same couple sharing one brief tender closed-mouth kiss beside a softly lit window. Non-sexual, non-erotic everyday affection only. No nudity, no underwear, no sexual activity, no school uniforms, no beds. Warm hand-painted watercolor storybook style, cream paper texture, sage green foliage, muted golden sunlight and dusty peach accents, delicate pencil outlines matching a calm Chinese campus life game. Landscape image, cinematic scenes, natural anatomy, no text or watermark.

## 验证

- `npm run typecheck`、`npm test`、`npm run build`。
- 63 项规则测试，覆盖旧功能回归、年龄独立保存、导入无法解锁、主动表白、跨周条件、一次性消耗、跳过收益、刷新重新确认、冷静、分手、复合、跟随、五条恋爱长期任务及存档校验。
- `scripts/check-romance-browser.mjs` 在 320×568、390×844、768×600、1280×900、844×390 下实际走完年龄选择 → IM → 主动表白 → 回家 → 隐藏成人入口 → 成年内容提示 → 刷新 → 跳过。检查弹窗可见范围与横向溢出；结果见 `romance-browser-checks.json`。

后续扩展可继续增加角色故事、约会场所和毕业后的日常；本版的关系操作与初始 30 段恋爱章节已经可以完整游玩。

男生情侣版本提示词（周野与顾星河路线使用该版本）：

> Use case: illustration-story. Asset for a Chinese life simulation's non-explicit adult romance screen. Create a horizontal three-panel watercolor triptych. Two clearly adult Chinese men aged 25, mature facial features and adult proportions, one with short dark brown hair wearing a cream shirt and olive jacket, the other with short black hair wearing a blue knit shirt. Both fully clothed casual outfits, no school uniforms. Same two men in each panel. Left: holding hands while walking by a tree-lined riverside in Xi'an at sunset. Center: sharing a gentle affectionate hug while sitting upright on a living room sofa. Right: sharing a brief, tender closed-mouth kiss by a softly glowing window. Purely romantic everyday affection, non-sexual and non-erotic. No nudity, underwear, sexual behavior, beds or seductive framing. Soft warm watercolor storybook illustration, cream textured paper, muted sage green and dusty peach, golden sunlight, delicate pencil outlines, cinematic landscape panels divided by narrow soft cream margins. Natural anatomy and hands. No text, logo or watermark.

弹窗中的保存与操作反馈改为独立状态行，不再浮在按钮上；地图中的临时提示保留原样。原有约见、地点边距与行动耗尽后的地图标记在五种尺寸下再次回归通过。
