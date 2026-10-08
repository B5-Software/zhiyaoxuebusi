import type { NewsItem } from './lifeTypes';
import { roll } from './lifeHealth';
const stories: Omit<NewsItem, 'id' | 'week'>[] = [
 {category:'教育',title:'校企项目被要求增加实习时长',text:'学分表里多了一栏工时。学生讨论：培养与廉价劳动之间，谁来划线？教育服务股预期改善，学生的空闲却减少了。',impacts:{'stock-school':.025},duration:3,rent:0,wages:0},
 {category:'劳动',title:'用工调查：岗位增加，平均起薪下降',text:'企业发布扩招消息，同时压低报价。企业利润预期上升不代表劳动者处境改善。新签合同受此次报价影响，旧合同按约履行。',impacts:{'stock-city':.022},duration:3,rent:0,wages:-.015},
 {category:'经济',title:'住房供给收紧，合租市场报价上调',text:'城市服务企业收入预期提高，家庭账单也随之增加。居住者承担的支出，与投资者期待的收益写在同一张纸上。',impacts:{'stock-city':.018},duration:3,rent:.012,wages:0},
 {category:'医疗',title:'公共医疗补助扩围，预约仍然排队',text:'补助改善支付能力，紧张的床位仍是另一道门槛。医疗救助窗口开放，申请需要等待与材料。',impacts:{'stock-city':-.012},duration:2,rent:0,wages:0},
 {category:'市场',title:'虚拟资产平台出现集中提款',text:'流动性骤降，市场担心兑付。价格既可能持续下跌，也可能因澄清反弹；高杠杆最先承受冲击。',impacts:{BTC:-.06,ETH:-.075},duration:2,rent:0,wages:0},
 {category:'市场',title:'链上结算网络完成升级',text:'网络费用预期下降，使用需求成为交易话题。技术进展与价格上涨没有保证关系，短线情绪可能先行透支。',impacts:{ETH:.055,BTC:.018},duration:3,rent:0,wages:0},
 {category:'经济',title:'信贷环境转向谨慎，风险资产承压',text:'融资成本抬升，企业推迟投资。招聘与市场同时感到寒意，家庭储备开始变得更重要。',impacts:{'stock-school':-.018,'stock-city':-.025,BTC:-.035,ETH:-.04},duration:4,rent:0,wages:-.01},
 {category:'教育',title:'教育服务公司被要求披露退款义务',text:'付费承诺与履约能力受到审视。公开信息减少了模糊空间，也改变了盈利预期。',impacts:{'stock-school':-.04},duration:2,rent:0,wages:0},
 {category:'劳动',title:'劳动争议调解通道增加线上受理',text:'渠道便利了一些，举证和等待仍需要时间。工资延迟后，可以登记追索；文本不会自动把欠薪变成收入。',impacts:{'stock-city':-.01},duration:2,rent:0,wages:0},
 {category:'市场',title:'大额持仓转入市场，引发抛售猜测',text:'转账并不等于卖出，但交易者已经开始下注。信息、解读与事实之间存在距离，价格可能反向波动。',impacts:{BTC:-.035,ETH:-.025},duration:2,rent:0,wages:0},
 {category:'经济',title:'生活服务需求恢复，企业上调招聘报价',text:'订单增加带来新的职位。新报价改善一部分机会，工时与身体代价仍需要自己核对。',impacts:{'stock-city':.025,'stock-school':.009},duration:3,rent:0,wages:.015},
 {category:'市场',title:'低费率流动性池吸引资金，价格分歧扩大',text:'资金进入链上池，交易量上升。提供流动性仍会承担价格分歧带来的损失，池子的热闹不是无风险利息。',impacts:{ETH:.035},duration:2,rent:0,wages:0},
];
export function publishNews(seed:number,week:number,existing:NewsItem[]):NewsItem {
 const previous=existing.slice(0,6).map(n=>n.id.split(':')[0]);
 const eligible=stories.map((s,i)=>({s,i})).filter(({i})=>!previous.includes(String(i)));
 const picked=eligible[Math.floor(roll(seed,week+317)*eligible.length)];
 return {...structuredClone(picked.s),id:picked.i+':'+week,week};
}
export function newsPressure(news:NewsItem[],asset:string,week:number){
 return news.reduce((sum,n)=>week>n.week&&week<=n.week+n.duration?sum+(n.impacts[asset]??0)*(1-(week-n.week-1)/n.duration):sum,0);
}
