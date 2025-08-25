import type { TeamPerformanceResponse } from '@/types';

export const mockTeamPerformance: TeamPerformanceResponse = {
  summary: {
    total_revenue: 550000,
    total_students: 55,
    total_reward_amount: 25000,
    team_target_students: 100,
    team_target_revenue: 1000000,
    revenue_completion_rate: 55,
    students_completion_rate: 55,
    month: '2025-08',
  },
  members: [
    {
      user_id: 1,
      real_name: '张三',
      role_type: 5, // 团队负责人
      is_leader: true,
      personal_students_count: 10,
      personal_revenue: 100000,
      personal_reward_amount: 5000,
      personal_target_students: 20,
      personal_target_revenue: 200000,
      personal_completion_rate: 50,
      team_contribution_rate: 18.18,
      month: '2025-08',
    },
    {
      user_id: 2,
      real_name: '李四',
      role_type: 1, // 全职招生员
      is_leader: false,
      personal_students_count: 15,
      personal_revenue: 150000,
      personal_reward_amount: 7500,
      personal_target_students: 25,
      personal_target_revenue: 250000,
      personal_completion_rate: 60,
      team_contribution_rate: 27.27,
      month: '2025-08',
    },
    {
      user_id: 3,
      real_name: '王五',
      role_type: 2, // 兼职招生员
      is_leader: false,
      personal_students_count: 5,
      personal_revenue: 50000,
      personal_reward_amount: 2500,
      personal_target_students: 10,
      personal_target_revenue: 100000,
      personal_completion_rate: 50,
      team_contribution_rate: 9.09,
      month: '2025-08',
    },
  ],
};

