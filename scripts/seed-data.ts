/**
 * 数据库初始数据填充脚本
 * 运行: ts-node scripts/seed-data.ts
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('开始填充初始数据...')

  // 1. 创建管理员账号
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      role: 'admin',
    },
  })
  console.log('✓ 管理员账号创建成功:', admin.username)

  // 2. 创建商家信息
  const merchant = await prisma.merchantInfo.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: '学与思教育',
      description: '专注服务于小学、初中、高中年级学生，提供1对1全科上门家教辅导，提供上门试课。我们拥有来自985/211高校的优秀大学生教师团队，以及经验丰富的专职教师，致力于为每一位学生提供个性化的学习方案。',
      services: [
        '全科目上门家教',
        '专职老师授课',
        '传授学习方法',
        '1对1上门辅导',
        '上门试课服务',
        '预约上门试课',
      ],
      advantages: [
        '985/211名校大学生师资',
        '专业教学团队，经验丰富',
        '因材施教，个性化教学',
        '灵活上门时间安排',
        '免费试课，满意再报名',
        '家长可全程监督教学',
      ],
      contact: {
        phone: '400-123-4567',
        address: '各城市均有服务网点',
        wechat: 'xueyusi_edu',
      },
      businessHours: '周一至周日 9:00-21:00',
      isActive: true,
    },
  })
  console.log('✓ 商家信息创建成功:', merchant.name)

  // 3. 创建示例轮播图
  const banners = [
    {
      title: '985/211大学生上门家教',
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=400&fit=crop',
      link: '',
      order: 0,
      description: '严选名校大学生，专业可靠',
      isActive: true,
    },
    {
      title: '全科一对一辅导',
      imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=400&fit=crop',
      link: '',
      order: 1,
      description: '小学、初中、高中全科目覆盖',
      isActive: true,
    },
    {
      title: '免费试课，满意再报名',
      imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&h=400&fit=crop',
      link: '',
      order: 2,
      description: '上门试课服务，体验后再决定',
      isActive: true,
    },
  ]

  for (const banner of banners) {
    await prisma.banner.create({ data: banner })
  }
  console.log('✓ 轮播图创建成功:', banners.length, '条')

  console.log('\n初始数据填充完成！')
  console.log('\n登录信息:')
  console.log('用户名: admin')
  console.log('密码: admin123')
  console.log('\n访问地址:')
  console.log('前端: http://localhost:3000')
  console.log('后台: http://localhost:3000/admin/login')
  console.log('API: http://localhost:3001/api')
}

main()
  .catch((e) => {
    console.error('填充数据时出错:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

