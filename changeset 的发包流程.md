changeset 的发包流程

npm 包一般的版本结构为：1.0.0，类似这样的三位数版本号，分别是对应的 changeset version 里面的：major(大)、minor(小)、patch(补丁)

pnpm run changeset:修改版本号，以及修改的具体信息
pnpm run packages-version: 版本号已修改完成，会自动生成 CHANGELOG.md 文件，记录版本号的变化。
pnpm run publish:发布版本
