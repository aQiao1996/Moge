/**
 * 世界设定 DTO
 * 用于接收前端发送的扁平字段数据
 */

// 地理环境子项
export interface GeographicLocationDto {
  name: string;
  type?: string;
  description?: string;
  climate?: string;
  terrain?: string;
  specialFeatures?: string;
}

// 政治势力子项
export interface PoliticalForceDto {
  name: string;
  type?: string;
  description?: string;
  territory?: string;
  leadership?: string;
  ideology?: string;
  strength?: string;
  relationships?: string;
}

// 文化习俗子项
export interface CulturalCustomDto {
  name: string;
  category?: string;
  description?: string;
  origin?: string;
  significance?: string;
  practices?: string;
}

// 修炼等级子项
export interface CultivationLevelDto {
  name: string;
  rank?: number;
  description?: string;
  requirements?: string;
  abilities?: string;
  lifespan?: string;
  resources?: string;
}

// 历史事件子项
export interface HistoricalEventDto {
  name: string;
  timeframe?: string;
  description?: string;
  participants?: string;
  causes?: string;
  consequences?: string;
  significance?: string;
}

// 历史人物子项
export interface HistoricalFigureDto {
  name: string;
  title?: string;
  era?: string;
  description?: string;
  achievements?: string;
  background?: string;
  legacy?: string;
}

// 创建世界设定的 DTO（扁平字段格式）
export interface CreateWorldDto {
  // 基础信息
  name: string;
  type: string;
  era?: string;
  description?: string;

  // 地理环境（扁平字段）
  generalClimate?: string;
  majorTerrain?: string;
  geographicLocations?: GeographicLocationDto[];

  // 政治势力（扁平字段）
  politicalSystem?: string;
  majorConflicts?: string;
  politicalForces?: PoliticalForceDto[];

  // 文化体系（扁平字段）
  socialStructure?: string;
  languages?: string;
  religions?: string;
  culturalCustoms?: CulturalCustomDto[];

  // 修炼/力量体系（扁平字段）
  powerSystemName?: string;
  powerSystemDescription?: string;
  cultivationResources?: string;
  cultivationLevels?: CultivationLevelDto[];

  // 历史脉络（扁平字段）
  worldHistory?: string;
  currentEvents?: string;
  historicalEvents?: HistoricalEventDto[];
  historicalFigures?: HistoricalFigureDto[];

  // 标签和备注
  tags?: string[];
  remarks?: string;
}

// 更新世界设定的 DTO（所有字段可选）
export type UpdateWorldDto = Partial<CreateWorldDto>;
