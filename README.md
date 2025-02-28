# mlnlp-website



## 项目介绍

本项目为 MLNLP 社区的官方网站。



## 目录结构

```
├── assets：静态资源。
	├── css：样式表文件（css）。
	├── img：图片资源。
		├── activity：活动相关的图片。
			├── meeting：MLNLP大会图片。
				├── meeting-1：第一届MLNLP大会图片。
				└── meeting-x：第x届MLNLP大会图片。
			├── seminar：MLNLP学术研讨会图片，内部结构与meeting相似。
			└── talk：MLNLP学术Talk图片，内部结构与meeting相似。
		├── committee：社区成员照片。
		├── logo：各类logo图片。
		└── qrcode：二维码图片。
	├── js：JavaScript文件。
		└── db：数据库相关的JavaScript文件。
	└── vendor：依赖的第三方库或框架。
├── db：数据库。
	└── mlnlp.sqlite：网站的sqlite数据库文件。
├── activity.html：活动详情页面。
├── activity_category.html：活动目录页面。
├── committee.html：社区成员页面。
├── index.html：首页。
├── project.html：开源项目页面。
└── README.md：帮助文档。
```



## 版本更新

#### V1.1.0（2025/02/07）

1. 调整开源项目页面中的卡片样式，其中新增了项目的 Stars 与 Forks 信息。
2. 调整开源项目页面中的卡片显示顺序，更改为按照项目的 Stars 数自高向低排序。
3. 调整开源项目页面中的卡片布局方式，更改为 2 列的瀑布流布局。
4. 略微调整了开源项目页面的布局细节。

#### V1.0.1（2025/01/27）

1. 修复部分图片显示异常的问题。

#### V1.0.0（2025/01/26）

1. 网站发布。
1. 新增首页、学术活动、开源项目、社区成员等页面及其相应的数据和资源。