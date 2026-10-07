# 展示截图指南

当前四张截图已检查并插入中英文 README。顶部展示隐藏答案，界面展示小节展示答案恢复，范围选择和统计位于可展开区域。后续更新时保持以下文件名，README 无需更改链接。

使用仓库里的 `examples/Recall Check Demo.md`，其中有 6 道未完成题和 2 道已记住题，全部是合成示例。将该文件复制到 Obsidian Vault 后打开，避免使用私人学习笔记制作公开截图。

## 推荐的 4 张截图

面向国际用户的主 README 建议使用英文界面：在 Obsidian 的语言设置中选择 English，再重载插件。中文 README 可以用同样步骤补充中文截图。截图只截弹窗，保留完整标题、题目和按钮；保持各张截图的窗口大小一致。

| 文件名                | 截图位置与操作                                                                                 | 想展示的内容                             |
| --------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `start-review.png`    | 打开展示笔记，点击脑形图标。范围选 All，顺序选 Forward，然后截完整的开始弹窗；先不要点 Start。 | 范围选项、Remembered、排序选择和启动按钮 |
| `review-hidden.png`   | 开始后停在第 1 / 6 题，答案保持隐藏，截完整复习弹窗。                                          | 公式答案遮罩、评分第一行、导航第二行     |
| `review-revealed.png` | 同一题按 Space，窗口尺寸不变，再截完整弹窗。                                                   | 隐藏／显示前后的公式排版                 |
| `review-summary.png`  | 对 6 道题依次按 0、1、2、3、0、2，最后截统计弹窗。                                             | 已评分 6 / 6、各评分数量和百分比         |

前 3 张优先；统计图可稍后补充。如果想展示多行中文答案，可先拍完第 1 题，再用右方向键到第 3 题，分别拍隐藏和显示状态。

评分会修改 Vault 中的展示笔记。需要重新开始截图时，可再次从仓库中的原始示例复制一份。不要使用 Ctrl/Cmd+Z 去撤销其他笔记的内容。

## 图片放在哪里

将截图保存或复制到仓库的：

```text
assets/screenshots/start-review.png
assets/screenshots/review-hidden.png
assets/screenshots/review-revealed.png
assets/screenshots/review-summary.png
```

图片可用 PNG；裁掉无关桌面区域即可，不需要加花哨的边框。建议宽度约 1200–1600 像素，让文字在 GitHub 上缩放后仍然清楚。

## 插入英文 README

`README.md` 的标题介绍后已经使用下面的概览图引用。替换同名图片文件即可更新显示：

```markdown
![Recall Check reviewing a question with hidden math answers](assets/screenshots/review-hidden.png)
```

其他三张图片已放入 Screenshots 小节，其中范围和统计使用可展开区域。新增图片时可参考以下写法，避免重复插入现有图片：

```markdown
## Screenshots

### Choose your review range

![Choose filters and order](assets/screenshots/start-review.png)

### Reveal answers without changing the layout

![Reveal the same math answers](assets/screenshots/review-revealed.png)

### Review summary

![Unique-card ratings and ungraded count](assets/screenshots/review-summary.png)
```

## 插入中文 README

中文 README 位于 `docs/README.zh-CN.md`，路径需要多一个 `../`：

```markdown
![Recall Check 的公式填空复习界面](../assets/screenshots/review-hidden.png)
```

更新截图时保持文件名不变；如需增加或更名，请同时修改中英文 README 的相对路径，并确认图片文件存在。
