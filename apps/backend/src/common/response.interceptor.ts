import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from "@nestjs/common";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

// * 拦截器是使用 @Injectable() 装饰器注解的类。拦截器应该实现 NestInterceptor 接口
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 使用 rxjs 的管道操作符 map 函数，对响应数据进行统一处理
    return next.handle().pipe(
      // 处理统一返回格式
      map(data => ({ code: 200, data, message: "success" })),
      // * http-exception.filter 中处理了 这里就不用了
      // 异常拦截器，拦截每个请求中的异常，目的是将异常码和异常信息改写为 { code: xxx, message: xxx } 类型
      // catchError(error => {
      //   if (error instanceof HttpException) {
      //     return Promise.resolve({
      //       code: error.getStatus(),
      //       message: error.getResponse(),
      //     });
      //   }
      //   return Promise.resolve({
      //     code: 500,
      //     message: `出现了意外错误：${error.toString()}`,
      //   });
      // })
    );
  }
}
