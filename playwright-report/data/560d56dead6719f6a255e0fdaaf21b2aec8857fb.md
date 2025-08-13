# Page snapshot

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T"
- heading "后台管理系统注册" [level=3]
- text: 邮箱
- textbox "邮箱"
- text: 密码
- textbox "密码"
- text: 姓名
- textbox "姓名"
- text: 身份证号
- textbox "身份证号"
- text: 手机号
- textbox "手机号"
- text: 选择身份
- combobox: 请选择身份
- button "注册并提交审批"
- text: 已有账号？
- link "去登录":
  - /url: /login
```