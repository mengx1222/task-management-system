import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { IndividualTask, TeamTask } from '@/storage/database/shared/schema';

/**
 * 基于标签的任务推荐算法
 * 核心逻辑：
 * 1. 从用户标签中提取推荐标签
 * 2. 精准匹配任务类型
 * 3. 补全不足的任务列表
 */
export async function getRecommendedTasks(
  missionTags: string | null,
  taskType: 'individual' | 'team',
  pageSize: number = 10
): Promise<(IndividualTask | TeamTask)[]> {
  const client = getSupabaseClient();
  const tableName = taskType === 'individual' ? 'individual_tasks' : 'team_tasks';

  // 解析用户标签
  const tags = missionTags
    ? missionTags.split(',').map(tag => tag.trim()).filter(Boolean)
    : [];

  // 如果没有标签，返回最新任务（冷启动处理）
  if (tags.length === 0) {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .eq('task_status', '未完成')
      .order('created_at', { ascending: false })
      .limit(pageSize);

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    return data || [];
  }

  // 第一步：精准匹配用户标签的任务
  const { data: matchedTasks, error: matchError } = await client
    .from(tableName)
    .select('*')
    .in('task_type', tags)
    .eq('task_status', '未完成')
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (matchError) {
    console.error('Error matching tasks:', matchError);
    return [];
  }

  // 如果匹配的任务足够，直接返回
  if (matchedTasks && matchedTasks.length >= pageSize) {
    return matchedTasks.slice(0, pageSize);
  }

  // 第二步：补全不足的任务
  const needSupplement = pageSize - (matchedTasks?.length || 0);
  const matchedIds = matchedTasks?.map(t => t.id) || [];

  const { data: supplementTasks, error: supplementError } = await client
    .from(tableName)
    .select('*')
    .not('id', 'in', matchedIds.length > 0 ? `(${matchedIds.join(',')})` : '(0)')
    .eq('task_status', '未完成')
    .order('created_at', { ascending: false })
    .limit(needSupplement);

  if (supplementError) {
    console.error('Error supplementing tasks:', supplementError);
    return matchedTasks || [];
  }

  // 合并结果：匹配的任务在前，补全的在后
  return [...(matchedTasks || []), ...(supplementTasks || [])];
}

/**
 * 计算任务与用户标签的匹配度
 */
export function calculateMatchScore(
  taskType: string,
  userTags: string[]
): number {
  if (!taskType || userTags.length === 0) return 0;
  return userTags.includes(taskType) ? 100 : 0;
}

/**
 * 获取任务类型统计
 */
export async function getTaskTypeStats(): Promise<Record<string, number>> {
  const client = getSupabaseClient();

  const { data: individualTasks } = await client
    .from('individual_tasks')
    .select('task_type');

  const { data: teamTasks } = await client
    .from('team_tasks')
    .select('task_type');

  const stats: Record<string, number> = {};

  individualTasks?.forEach(task => {
    if (task.task_type) {
      stats[task.task_type] = (stats[task.task_type] || 0) + 1;
    }
  });

  teamTasks?.forEach(task => {
    if (task.task_type) {
      stats[task.task_type] = (stats[task.task_type] || 0) + 1;
    }
  });

  return stats;
}
