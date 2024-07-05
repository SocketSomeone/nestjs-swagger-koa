import * as jsyaml from 'js-yaml';
import { OpenAPIObject, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { HttpServer, INestApplication } from '@nestjs/common';
import { resolvePath } from '@nestjs/swagger/dist/utils/resolve-path.util';
import {
	buildSwaggerHTML,
	buildSwaggerInitJS,
	getSwaggerAssetsAbsoluteFSPath
} from '@nestjs/swagger/dist/swagger-ui';
import { NestKoaApplication } from 'nest-koa-adapter';
import { normalizeRelPath } from '@nestjs/swagger/dist/utils/normalize-rel-path';
import { getGlobalPrefix } from '@nestjs/swagger/dist/utils/get-global-prefix';
import { validatePath } from '@nestjs/swagger/dist/utils/validate-path.util';
import { validateGlobalPrefix } from '@nestjs/swagger/dist/utils/validate-global-prefix.util';
import { loadPackage } from '@nestjs/common/utils/load-package.util';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export class KoaSwaggerModule extends SwaggerModule {
	private static override serveStatic(
		finalPath: string,
		app: INestApplication,
		customStaticPath?: string
	): void {
		const httpAdapter = app.getHttpAdapter();

		const swaggerAssetsPath = customStaticPath
			? resolvePath(customStaticPath)
			: getSwaggerAssetsAbsoluteFSPath();

		if (httpAdapter && httpAdapter.getType() === 'koa') {
			const serveStaticMiddleware = loadPackage('koa-static', 'KoaSwaggerModule');

			const mountMiddleware = loadPackage('koa-mount', 'KoaSwaggerModule');

			(app as NestKoaApplication).use(
				mountMiddleware(finalPath, serveStaticMiddleware(swaggerAssetsPath))
			);
		}
	}

	private static override serveDocuments(
		finalPath: string,
		urlLastSubdirectory: string,
		httpAdapter: HttpServer,
		documentOrFactory: OpenAPIObject | (() => OpenAPIObject),
		options: {
			swaggerUiEnabled: boolean;
			jsonDocumentUrl: string;
			yamlDocumentUrl: string;
			swaggerOptions: SwaggerCustomOptions;
		}
	) {
		let document: OpenAPIObject;

		const getBuiltDocument = () => {
			if (!document) {
				document =
					typeof documentOrFactory === 'function'
						? documentOrFactory()
						: documentOrFactory;
			}
			return document;
		};

		if (options.swaggerUiEnabled) {
			KoaSwaggerModule.serveSwaggerUi(
				finalPath,
				urlLastSubdirectory,
				httpAdapter,
				getBuiltDocument,
				options.swaggerOptions
			);
		}

		KoaSwaggerModule.serveDefinitions(httpAdapter, getBuiltDocument, {
			jsonDocumentUrl: options.jsonDocumentUrl,
			yamlDocumentUrl: options.yamlDocumentUrl,
			swaggerOptions: options.swaggerOptions
		});
	}

	private static override serveSwaggerUi(
		finalPath: string,
		urlLastSubdirectory: string,
		httpAdapter: HttpServer,
		getBuiltDocument: () => OpenAPIObject,
		swaggerOptions: SwaggerCustomOptions
	) {
		const baseUrlForSwaggerUI = normalizeRelPath(`./${urlLastSubdirectory}/`);

		let swaggerUiHtml: string;
		let swaggerUiInitJS: string;

		httpAdapter.get(normalizeRelPath(`${finalPath}/swagger-ui-init.js`), (req, res) => {
			httpAdapter.setHeader(res, 'Content-Type', 'application/javascript');

			const document = getBuiltDocument();

			if (swaggerOptions.patchDocumentOnRequest) {
				const documentToSerialize = swaggerOptions.patchDocumentOnRequest(
					req,
					res,
					document
				);
				const swaggerInitJsPerRequest = buildSwaggerInitJS(
					documentToSerialize,
					swaggerOptions
				);
				return res.send(swaggerInitJsPerRequest);
			}

			if (!swaggerUiInitJS) {
				swaggerUiInitJS = buildSwaggerInitJS(document, swaggerOptions);
			}

			httpAdapter.reply(res, swaggerUiInitJS, 200);
		});

		/**
		 * Covers assets fetched through a relative path when Swagger url ends with a slash '/'.
		 * @see https://github.com/nestjs/swagger/issues/1976
		 */
		try {
			httpAdapter.get(
				normalizeRelPath(`${finalPath}/${urlLastSubdirectory}/swagger-ui-init.js`),
				(req, res) => {
					httpAdapter.setHeader(res, 'Content-Type', 'application/javascript');

					const document = getBuiltDocument();

					if (swaggerOptions.patchDocumentOnRequest) {
						const documentToSerialize = swaggerOptions.patchDocumentOnRequest(
							req,
							res,
							document
						);
						const swaggerInitJsPerRequest = buildSwaggerInitJS(
							documentToSerialize,
							swaggerOptions
						);
						return res.send(swaggerInitJsPerRequest);
					}

					if (!swaggerUiInitJS) {
						swaggerUiInitJS = buildSwaggerInitJS(document, swaggerOptions);
					}

					httpAdapter.reply(res, swaggerUiInitJS, 200);
				}
			);
		} catch (err) {
			/**
			 * Error is expected when urlLastSubdirectory === ''
			 * in that case that route is going to be duplicating the one above
			 */
		}

		httpAdapter.get(finalPath, (req, res) => {
			httpAdapter.setHeader(res, 'Content-Type', 'text/html');

			if (!swaggerUiHtml) {
				swaggerUiHtml = buildSwaggerHTML(baseUrlForSwaggerUI, swaggerOptions);
			}

			httpAdapter.reply(res, swaggerUiHtml, 200);
		});

		// fastify doesn't resolve 'routePath/' -> 'routePath', that's why we handle it manually
		try {
			httpAdapter.get(normalizeRelPath(`${finalPath}/`), (req, res) => {
				httpAdapter.setHeader(res, 'Content-Type', 'text/html');

				if (!swaggerUiHtml) {
					swaggerUiHtml = buildSwaggerHTML(baseUrlForSwaggerUI, swaggerOptions);
				}

				httpAdapter.reply(res, swaggerUiHtml, 200);
			});
		} catch (err) {
			/**
			 * When Fastify adapter is being used with the "ignoreTrailingSlash" configuration option set to "true",
			 * declaration of the route "finalPath/" will throw an error because of the following conflict:
			 * Method '${method}' already declared for route '${path}' with constraints '${JSON.stringify(constraints)}.
			 * We can simply ignore that error here.
			 */
		}
	}

	private static override serveDefinitions(
		httpAdapter: HttpServer,
		getBuiltDocument: () => OpenAPIObject,
		options: {
			jsonDocumentUrl: string;
			yamlDocumentUrl: string;
			swaggerOptions: SwaggerCustomOptions;
		}
	) {
		httpAdapter.get(normalizeRelPath(options.jsonDocumentUrl), (req, res) => {
			res.type('application/json');
			const document = getBuiltDocument();

			const documentToSerialize = options.swaggerOptions.patchDocumentOnRequest
				? options.swaggerOptions.patchDocumentOnRequest(req, res, document)
				: document;

			res.send(JSON.stringify(documentToSerialize));
		});

		httpAdapter.get(normalizeRelPath(options.yamlDocumentUrl), (req, res) => {
			res.type('text/yaml');
			const document = getBuiltDocument();

			const documentToSerialize = options.swaggerOptions.patchDocumentOnRequest
				? options.swaggerOptions.patchDocumentOnRequest(req, res, document)
				: document;

			const yamlDocument = jsyaml.dump(documentToSerialize, {
				skipInvalid: true,
				noRefs: true
			});
			res.send(yamlDocument);
		});
	}

	public static setup(
		path: string,
		app: INestApplication,
		documentOrFactory: OpenAPIObject | (() => OpenAPIObject),
		options?: SwaggerCustomOptions
	) {
		const globalPrefix = getGlobalPrefix(app);
		const finalPath = validatePath(
			options?.useGlobalPrefix && validateGlobalPrefix(globalPrefix)
				? `${globalPrefix}${validatePath(path)}`
				: path
		);
		const urlLastSubdirectory = finalPath.split('/').slice(-1).pop() || '';
		const validatedGlobalPrefix =
			options?.useGlobalPrefix && validateGlobalPrefix(globalPrefix)
				? validatePath(globalPrefix)
				: '';

		const finalJSONDocumentPath = options?.jsonDocumentUrl
			? `${validatedGlobalPrefix}${validatePath(options.jsonDocumentUrl)}`
			: `${finalPath}-json`;

		const finalYAMLDocumentPath = options?.yamlDocumentUrl
			? `${validatedGlobalPrefix}${validatePath(options.yamlDocumentUrl)}`
			: `${finalPath}-yaml`;

		const swaggerUiEnabled = options?.swaggerUiEnabled ?? true;

		const httpAdapter = app.getHttpAdapter();

		KoaSwaggerModule.serveDocuments(
			finalPath,
			urlLastSubdirectory,
			httpAdapter,
			documentOrFactory,
			{
				swaggerUiEnabled,
				jsonDocumentUrl: finalJSONDocumentPath,
				yamlDocumentUrl: finalYAMLDocumentPath,
				swaggerOptions: options || {}
			}
		);

		if (swaggerUiEnabled) {
			KoaSwaggerModule.serveStatic(finalPath, app, options?.customSwaggerUiPath);
			/**
			 * Covers assets fetched through a relative path when Swagger url ends with a slash '/'.
			 * @see https://github.com/nestjs/swagger/issues/1976
			 */
			const serveStaticSlashEndingPath = `${finalPath}/${urlLastSubdirectory}`;
			/**
			 *  serveStaticSlashEndingPath === finalPath when path === '' || path === '/'
			 *  in that case we don't need to serve swagger assets on extra sub path
			 */
			if (serveStaticSlashEndingPath !== finalPath) {
				KoaSwaggerModule.serveStatic(serveStaticSlashEndingPath, app);
			}
		}
	}
}
