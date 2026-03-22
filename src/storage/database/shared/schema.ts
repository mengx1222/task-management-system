import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  doublePrecision,
  date,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// ============================================
// 系统表（保留，不可删除）
// ============================================
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ============================================
// 用户相关表
// ============================================

// 用户账户表
export const users = pgTable(
  "users",
  {
    id: serial().notNull(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    nickname: varchar("nickname", { length: 50 }),
    email: varchar("email", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    avatar: varchar("avatar", { length: 255 }),
    userGroup: varchar("user_group", { length: 32 }).default("student"),
    state: integer("state").default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    loginTime: timestamp("login_time", { withTimezone: true }),
  },
  (table) => [index("users_username_idx").on(table.username)]
);

// 学生用户表
export const studentUsers = pgTable(
  "student_users",
  {
    id: serial().notNull(),
    userId: integer("user_id").notNull(),
    studentNumber: varchar("student_number", { length: 50 }).notNull().unique(),
    studentName: varchar("student_name", { length: 50 }),
    studentGender: varchar("student_gender", { length: 10 }),
    contactNumber: varchar("contact_number", { length: 20 }),
    missionRecommendation: varchar("mission_recommendation", { length: 500 }),
    examineState: varchar("examine_state", { length: 20 }).default("未审核"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("student_users_number_idx").on(table.studentNumber)]
);

// 组长用户表
export const teamLeaderUsers = pgTable(
  "team_leader_users",
  {
    id: serial().notNull(),
    userId: integer("user_id").notNull(),
    teamLeaderNumber: varchar("team_leader_student_number", { length: 50 }).notNull().unique(),
    teamLeaderName: varchar("name_of_team_leader", { length: 50 }),
    teamLeaderGender: varchar("group_leader_gender", { length: 10 }),
    teamLeaderPhone: varchar("team_leader_mobile_phone", { length: 20 }),
    missionRecommendation: varchar("mission_recommendation", { length: 500 }),
    examineState: varchar("examine_state", { length: 20 }).default("未审核"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("team_leader_number_idx").on(table.teamLeaderNumber)]
);

// ============================================
// 任务相关表
// ============================================

// 任务类型表
export const taskTypes = pgTable("task_types", {
  id: serial().notNull(),
  typeName: varchar("task_type", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// 个人任务表
export const individualTasks = pgTable(
  "individual_tasks",
  {
    id: serial().notNull(),
    taskNumber: varchar("task_number", { length: 50 }).notNull().unique(),
    taskName: varchar("task_name", { length: 100 }).notNull(),
    courseName: varchar("course_name", { length: 100 }),
    taskType: varchar("task_type", { length: 50 }),
    taskDescription: text("task_description"),
    taskAttachments: varchar("task_attachments", { length: 500 }),
    coverChart: varchar("cover_chart", { length: 255 }),
    deadline: date("deadline"),
    taskStatus: varchar("task_status", { length: 20 }).default("未完成"),
    hits: integer("hits").default(0),
    praiseLen: integer("praise_len").default(0),
    collectLen: integer("collect_len").default(0),
    commentLen: integer("comment_len").default(0),
    recommend: integer("recommend").default(0),
    createBy: integer("create_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("individual_tasks_number_idx").on(table.taskNumber),
    index("individual_tasks_type_idx").on(table.taskType),
  ]
);

// 团队任务表
export const teamTasks = pgTable(
  "team_tasks",
  {
    id: serial().notNull(),
    taskNumber: varchar("task_number", { length: 50 }).notNull().unique(),
    taskName: varchar("task_name", { length: 100 }).notNull(),
    courseName: varchar("course_name", { length: 100 }),
    taskType: varchar("task_type", { length: 50 }),
    taskDescription: text("task_description"),
    taskAttachments: varchar("task_attachments", { length: 500 }),
    coverChart: varchar("cover_chart", { length: 255 }),
    deadline: date("deadline"),
    numberOfPeopleRequired: integer("number_of_people_required").default(1),
    taskStatus: varchar("task_status", { length: 20 }).default("未完成"),
    hits: integer("hits").default(0),
    praiseLen: integer("praise_len").default(0),
    collectLen: integer("collect_len").default(0),
    commentLen: integer("comment_len").default(0),
    recommend: integer("recommend").default(0),
    createBy: integer("create_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("team_tasks_number_idx").on(table.taskNumber),
    index("team_tasks_type_idx").on(table.taskType),
  ]
);

// 任务小组表
export const taskTeams = pgTable(
  "task_teams",
  {
    id: serial().notNull(),
    teamNo: varchar("team_no", { length: 50 }),
    taskNumber: varchar("task_number", { length: 50 }),
    courseName: varchar("course_name", { length: 100 }),
    taskType: varchar("task_type", { length: 50 }),
    taskDescription: text("task_description"),
    taskAttachments: varchar("task_attachments", { length: 500 }),
    deadline: date("deadline"),
    teamLeaderId: integer("team_leader_user"),
    teamLeaderName: varchar("name_of_team_leader", { length: 50 }),
    teamLeaderPhone: varchar("team_leader_mobile_phone", { length: 20 }),
    numberOfPeopleRequired: integer("number_of_people_required").default(1),
    dateOfEstablishment: date("date_of_establishment"),
    groupRemarks: text("group_remarks"),
    examineState: varchar("examine_state", { length: 20 }).default("未审核"),
    examineReply: varchar("examine_reply", { length: 255 }),
    hits: integer("hits").default(0),
    collectLen: integer("collect_len").default(0),
    commentLen: integer("comment_len").default(0),
    createBy: integer("create_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("task_teams_no_idx").on(table.teamNo)]
);

// ============================================
// 任务流程表
// ============================================

// 个人任务报名表
export const taskRegistrations = pgTable(
  "task_registrations",
  {
    id: serial().notNull(),
    enrollmentNumber: varchar("enrollment_number", { length: 50 }),
    taskNumber: varchar("task_number", { length: 50 }),
    courseName: varchar("course_name", { length: 100 }),
    taskType: varchar("task_type", { length: 50 }),
    taskDescription: text("task_description"),
    taskAttachments: varchar("task_attachments", { length: 500 }),
    deadline: date("deadline"),
    studentId: integer("student_users"),
    studentNumber: varchar("student_number", { length: 50 }),
    studentName: varchar("student_name", { length: 50 }),
    contactNumber: varchar("contact_number", { length: 20 }),
    registrationDate: date("registration_date"),
    registrationRemarks: text("registration_remarks"),
    taskProgress: varchar("task_progress", { length: 50 }).default("未开始"),
    examineState: varchar("examine_state", { length: 20 }).default("未审核"),
    examineReply: varchar("examine_reply", { length: 255 }),
    createBy: integer("create_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("task_registrations_number_idx").on(table.enrollmentNumber)]
);

// 团队任务报名表
export const taskEnrollmentTeams = pgTable(
  "task_enrollment_teams",
  {
    id: serial().notNull(),
    enrollmentNumber: varchar("enrollment_number", { length: 50 }),
    taskNumber: varchar("task_number", { length: 50 }),
    courseName: varchar("course_name", { length: 100 }),
    taskType: varchar("task_type", { length: 50 }),
    taskDescription: text("task_description"),
    taskAttachments: varchar("task_attachments", { length: 500 }),
    deadline: date("deadline"),
    teamNo: varchar("team_no", { length: 50 }),
    teamLeaderId: integer("team_leader_user"),
    teamLeaderName: varchar("name_of_team_leader", { length: 50 }),
    teamLeaderNumber: varchar("team_leader_student_number", { length: 50 }),
    teamLeaderPhone: varchar("team_leader_mobile_phone", { length: 20 }),
    teamMemberIds: text("team_member_user"),
    numberOfEnrolment: integer("number_of_enrolment").default(1),
    registrationDate: date("registration_date"),
    registrationRemarks: text("registration_remarks"),
    taskProgress: varchar("task_progress", { length: 50 }).default("未开始"),
    examineState: varchar("examine_state", { length: 20 }).default("未审核"),
    examineReply: varchar("examine_reply", { length: 255 }),
    createBy: integer("create_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("task_enrollment_teams_number_idx").on(table.enrollmentNumber)]
);

// 提交个人任务表
export const submitTasks = pgTable(
  "submit_tasks",
  {
    id: serial().notNull(),
    enrollmentNumber: varchar("enrollment_number", { length: 50 }),
    taskNumber: varchar("task_number", { length: 50 }),
    courseName: varchar("course_name", { length: 100 }),
    taskType: varchar("task_type", { length: 50 }),
    taskDescription: text("task_description"),
    deadline: date("deadline"),
    studentId: integer("student_users"),
    studentNumber: varchar("student_number", { length: 50 }),
    studentName: varchar("student_name", { length: 50 }),
    contactNumber: varchar("contact_number", { length: 20 }),
    completeTaskAttachments: varchar("complete_task_attachments", { length: 500 }),
    dateOfSubmission: date("date_of_submission"),
    remarks: text("remarks"),
    examineState: varchar("examine_state", { length: 20 }).default("未审核"),
    examineReply: varchar("examine_reply", { length: 255 }),
    createBy: integer("create_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("submit_tasks_enrollment_idx").on(table.enrollmentNumber)]
);

// 提交团队任务表
export const submitTaskTeams = pgTable(
  "submit_task_teams",
  {
    id: serial().notNull(),
    enrollmentNumber: varchar("enrollment_number", { length: 50 }),
    taskNumber: varchar("task_number", { length: 50 }),
    courseName: varchar("course_name", { length: 100 }),
    taskType: varchar("task_type", { length: 50 }),
    deadline: date("deadline"),
    teamLeaderId: integer("team_leader_user"),
    teamMemberIds: text("team_member_user"),
    studentNumber: varchar("student_number", { length: 50 }),
    studentName: varchar("student_name", { length: 50 }),
    contactNumber: varchar("contact_number", { length: 20 }),
    completeTaskAttachments: varchar("complete_task_attachments", { length: 500 }),
    dateOfSubmission: date("date_of_submission"),
    remarks: text("remarks"),
    examineState: varchar("examine_state", { length: 20 }).default("未审核"),
    examineReply: text("examine_reply"),
    createBy: integer("create_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("submit_task_teams_enrollment_idx").on(table.enrollmentNumber)]
);

// 任务评价表（个人）
export const taskEvaluations = pgTable(
  "task_evaluations",
  {
    id: serial().notNull(),
    enrollmentNumber: varchar("enrollment_number", { length: 50 }),
    taskNumber: varchar("task_number", { length: 50 }),
    courseName: varchar("course_name", { length: 100 }),
    taskType: varchar("task_type", { length: 50 }),
    taskDescription: text("task_description"),
    studentId: integer("student_users"),
    studentNumber: varchar("student_number", { length: 50 }),
    studentName: varchar("student_name", { length: 50 }),
    contactNumber: varchar("contact_number", { length: 20 }),
    completeTaskAttachments: varchar("complete_task_attachments", { length: 500 }),
    evaluationScore: doublePrecision("evaluation_score"),
    evaluationGrade: varchar("evaluation_grade", { length: 20 }),
    taskEvaluation: text("task_evaluation"),
    createBy: integer("create_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("task_evaluations_enrollment_idx").on(table.enrollmentNumber)]
);

// 任务评价表（团队）
export const taskEvaluationTeams = pgTable(
  "task_evaluation_teams",
  {
    id: serial().notNull(),
    enrollmentNumber: varchar("enrollment_number", { length: 50 }),
    taskNumber: varchar("task_number", { length: 50 }),
    courseName: varchar("course_name", { length: 100 }),
    taskType: varchar("task_type", { length: 50 }),
    teamLeaderId: integer("team_leader_user"),
    teamMemberIds: text("team_member_user"),
    studentNumber: varchar("student_number", { length: 50 }),
    studentName: varchar("student_name", { length: 50 }),
    contactNumber: varchar("contact_number", { length: 20 }),
    completeTaskAttachments: varchar("complete_task_attachments", { length: 500 }),
    evaluationScore: doublePrecision("evaluation_score"),
    evaluationGrade: varchar("evaluation_grade", { length: 20 }),
    taskEvaluation: text("task_evaluation"),
    createBy: integer("create_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("task_evaluation_teams_enrollment_idx").on(table.enrollmentNumber)]
);

// ============================================
// 系统内容表
// ============================================

// 通知公告表
export const notices = pgTable(
  "notices",
  {
    id: serial().notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("notices_title_idx").on(table.title)]
);

// 收藏表
export const collects = pgTable(
  "collects",
  {
    id: serial().notNull(),
    userId: integer("user_id").notNull(),
    sourceTable: varchar("source_table", { length: 50 }),
    sourceId: integer("source_id"),
    sourceField: varchar("source_field", { length: 50 }),
    title: varchar("title", { length: 200 }),
    img: varchar("img", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("collects_user_idx").on(table.userId)]
);

// 点赞表
export const praises = pgTable(
  "praises",
  {
    id: serial().notNull(),
    userId: integer("user_id").notNull(),
    sourceTable: varchar("source_table", { length: 50 }),
    sourceId: integer("source_id"),
    sourceField: varchar("source_field", { length: 50 }),
    status: integer("status").default(1),
    title: varchar("title", { length: 200 }),
    img: varchar("img", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("praises_user_idx").on(table.userId)]
);

// 评论表
export const comments = pgTable(
  "comments",
  {
    id: serial().notNull(),
    userId: integer("user_id").notNull(),
    nickname: varchar("nickname", { length: 50 }),
    avatar: varchar("avatar", { length: 255 }),
    sourceTable: varchar("source_table", { length: 50 }),
    sourceId: integer("source_id"),
    sourceField: varchar("source_field", { length: 50 }),
    content: text("content"),
    replyToId: integer("reply_to_id").default(0),
    sticky: integer("sticky").default(0),
    hidden: integer("hidden").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("comments_user_idx").on(table.userId)]
);

// 消息通知表
export const messageInforms = pgTable(
  "message_informs",
  {
    id: serial().notNull(),
    userId: integer("user_id").notNull(),
    title: varchar("title", { length: 200 }),
    content: varchar("content", { length: 500 }),
    type: varchar("type", { length: 50 }),
    state: varchar("state", { length: 20 }).default("未读"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("message_informs_user_idx").on(table.userId)]
);

// ============================================
// TypeScript Types
// ============================================
export type User = typeof users.$inferSelect;
export type StudentUser = typeof studentUsers.$inferSelect;
export type TeamLeaderUser = typeof teamLeaderUsers.$inferSelect;
export type TaskType = typeof taskTypes.$inferSelect;
export type IndividualTask = typeof individualTasks.$inferSelect;
export type TeamTask = typeof teamTasks.$inferSelect;
export type TaskRegistration = typeof taskRegistrations.$inferSelect;
export type SubmitTask = typeof submitTasks.$inferSelect;
export type TaskEvaluation = typeof taskEvaluations.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type Collect = typeof collects.$inferSelect;
export type Praise = typeof praises.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type MessageInform = typeof messageInforms.$inferSelect;
