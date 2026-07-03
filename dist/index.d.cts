import { z } from 'zod';
import { Command } from 'commander';
import { Node } from '@npmcli/arborist';
import { Manifest, Packument } from 'pacote';
import { StringValue } from 'ms';

type PackageName = string;
type PackageIdentifier = string;
type PackageVersion = string;
/**
 * Examples:
 *
 * Registry:
 *   latest
 *   beta
 *   ^1.0.0
 *   1.2.3
 *
 * Non-registry:
 *   IMPLICIT_VERSION_SPECIFIER
 */
type DependencyRequirementSpecifier = string;
type DistTagName = string;
type IsoDatetimeString = string;
type EngineSpecifier = string;
type PackageVersionMap = Record<PackageVersion, RegistryPackageManifest>;
type PackageTimeMap = Record<PackageVersion, IsoDatetimeString>;
type DistTagMap = Record<DistTagName, PackageVersion>;
type VersionDistTagMap = Record<PackageVersion, DistTagName[]>;
interface PackageEngines {
    node: EngineSpecifier | null;
}
type DependencyId = `${string}@${string}`;
type DependencyRequirementKey = `${string}:${string}`;
type DependencyDeclarationKey = `${string}:${string}`;
interface Dependency {
    identifier: PackageIdentifier;
    version: PackageVersion;
}
interface RegistryDependency {
    name: PackageName;
    version: PackageVersion;
}
interface DependencyDeclaration {
    name: string;
    specifier: string;
}
interface DependencyRequirement {
    identifier: PackageIdentifier;
    specifier: DependencyRequirementSpecifier;
}
interface PackageDependency {
    declaration: DependencyDeclaration;
    requirement: DependencyRequirement;
    sourceType: DependencySourceType;
}
/**
 * Normalized manifest of a registry package used during dependency graph expansion.
 *
 * This model intentionally contains only metadata that may affect dependency
 * resolution when the package is installed as a dependency.
 *
 * Fields that are never used during dependency resolution (for example
 * `devDependencies`, `scripts`, `keywords`, etc.) are intentionally omitted.
 *
 * This type does NOT represent a complete npm package.json.
 * Project manifests should use `ProjectPackageManifest` instead.
 */
interface PackageManifest {
    name: PackageName;
    version: PackageVersion;
    dependencies: PackageDependency[];
    peerDependencies: PackageDependency[];
    optionalDependencies: PackageDependency[];
    engines: PackageEngines;
    os: string[];
    cpu: string[];
}
interface RegistryPackageManifest extends PackageManifest {
    deprecated: string | null;
}
interface RegistryPackageInfo {
    distTags: DistTagName[];
    publishedAtMs: number | null;
}
interface RegistryPackageMetadata {
    manifest: RegistryPackageManifest;
    info: RegistryPackageInfo;
}
interface RegistryPackagePackument {
    versions: PackageVersionMap;
    time: PackageTimeMap;
    distTags: DistTagMap;
    versionDistTags: VersionDistTagMap;
}
declare enum PackageEngineKind {
    Node = "node"
}
interface RuntimeEnvironment {
    engine: PackageEngineKind;
    version: string;
}
declare enum DependencySourceType {
    /**
     * Mirrors npm-package-arg Result.type values.
     */
    Tag = "tag",
    Version = "version",
    Range = "range",
    Alias = "alias",
    File = "file",
    Directory = "directory",
    Git = "git",
    Remote = "remote"
}
declare enum PackageDependencyKind {
    Production = "production",
    Peer = "peer",
    Optional = "optional"
}

interface ResolvePackageManifestOptions {
    packageName: string;
    specifier: string;
}
interface RegistryPackageMetadataProvider {
    getPackument(identifier: PackageIdentifier): Promise<RegistryPackagePackument>;
    resolvePackageManifest(options: ResolvePackageManifestOptions): Promise<RegistryPackageManifest>;
}

interface BuildRegistryPackageMetadataOptions {
    packument: RegistryPackagePackument;
    manifest: RegistryPackageManifest;
}
declare class RegistryPackageMetadataBuilder {
    build(options: BuildRegistryPackageMetadataOptions): RegistryPackageMetadata;
}

interface ResolvePackumentVersionOptions {
    versions: string[];
    distTags: DistTagMap;
    specifier: string;
}
declare class PackumentVersionResolver {
    resolve(options: ResolvePackumentVersionOptions): string;
}

interface ResolveRegistryPackageManifestOptions {
    packument: RegistryPackagePackument;
    specifier: string;
}
declare class RegistryPackageManifestResolver {
    private versionResolver;
    constructor(versionResolver: PackumentVersionResolver);
    resolve(options: ResolveRegistryPackageManifestOptions): RegistryPackageManifest;
}

interface PackageResolutionCacheKey {
    packageName: string;
    specifier: string;
}
declare class InMemoryRegistryPackagePackumentCache {
    private packumentCache;
    getPackument(identifier: PackageIdentifier): RegistryPackagePackument | null;
    setPackument(identifier: PackageIdentifier, packument: RegistryPackagePackument): void;
}

interface ResolvePackageOptions {
    packageName: string;
    versionSpecifier: string;
}
declare class PackageMetadataRegistry {
    private provider;
    private cache;
    private manifestResolver;
    private metadataBuilder;
    constructor(provider: RegistryPackageMetadataProvider, cache: InMemoryRegistryPackagePackumentCache, manifestResolver: RegistryPackageManifestResolver, metadataBuilder: RegistryPackageMetadataBuilder);
    getPackument(identifier: PackageIdentifier): Promise<RegistryPackagePackument>;
    resolvePackageManifest(requirement: DependencyRequirement): Promise<RegistryPackageManifest>;
    resolvePackageMetadata(requirement: DependencyRequirement): Promise<RegistryPackageMetadata>;
}

interface UpgradeCandidate {
    packageName: string;
    installedVersion: string;
    candidateVersion: string;
    metadata: RegistryPackageMetadata;
}

type DependencyNodeId = `${string}@${string}`;
interface DependencyTreeNode {
    id: DependencyNodeId;
    identifier: PackageIdentifier;
    version: PackageVersion;
    dependencies: Set<DependencyNodeId>;
    dependents: Set<DependencyNodeId>;
    metadata: RegistryPackageMetadata;
}
interface DependencyEdge {
    dependentId: DependencyNodeId;
    dependencyId: DependencyNodeId;
}
interface DependencyGraphNode {
    id: DependencyNodeId;
    identifier: PackageIdentifier;
    version: PackageVersion;
    dependencies: Set<DependencyNodeId>;
    dependents: Set<DependencyNodeId>;
}

declare class DependencyTree {
    private nodes;
    private identifierIndex;
    constructor();
    addNode(node: DependencyTreeNode): void;
    linkDependency(options: DependencyEdge): void;
    dependsOn(edge: DependencyEdge): boolean;
    private dependsOnRecursive;
    hasNode(id: DependencyNodeId): boolean;
    getNode(id: DependencyNodeId): DependencyTreeNode;
    getAllNodes(): DependencyTreeNode[];
    findByIdentifier(identifier: string): DependencyTreeNode[];
    getDependencies(id: DependencyNodeId): DependencyTreeNode[];
    getDependents(id: DependencyNodeId): DependencyTreeNode[];
}

interface UpgradeEvaluationContext {
    metadataRegistry: PackageMetadataRegistry;
    candidate: UpgradeCandidate;
    candidateDependencyTree: DependencyTree;
}

interface EvaluatorDiagnostic {
    severity: EvaluatorDiagnosticSeverity;
    code: EvaluatorDiagnosticCode;
    message: string;
}
interface EvaluatorDiagnostics {
    evaluator: string;
    diagnostics: EvaluatorDiagnostic[];
}
interface EvaluatorResult extends EvaluatorDiagnostics {
    valid: boolean;
}
interface UpgradeEvaluationDiagnostics {
    candidate: UpgradeCandidate;
    evaluatorDiagnostics: EvaluatorDiagnostics[];
}
interface UpgradeEvaluationResult {
    candidate: UpgradeCandidate;
    constraintValidations: ConstraintValidationResult[];
    evaluatorResults: EvaluatorResult[];
    valid: boolean;
}
interface ConstraintValidationResult {
    validator: string;
    valid: boolean;
    diagnostics: ConstraintValidationDiagnostic[];
}
interface ConstraintValidationDiagnostic {
    code: ConstraintValidationDiagnosticCode;
    message: string;
}
declare enum ConstraintValidationDiagnosticCode {
    ForbiddenDependency = "FORBIDDEN_DEPENDENCY",
    DisallowedDependencySource = "DISALLOWED_DEPENDENCY_SOURCE"
}
declare enum EvaluatorDiagnosticSeverity {
    Error = "error",
    Warning = "warning",
    Info = "info"
}
declare enum EvaluatorDiagnosticCode {
    ReleaseAge = "release-age",
    MissingReleaseDate = "missing-release-date",
    NodeEngine = "node-engine",
    UnsupportedRuntime = "unsupported-runtime",
    PrereleaseVersion = "prerelease-version",
    MissingStableDistTag = "missing-stable-dist-tag",
    DeprecatedPackage = "deprecated-package",
    TreeNodeEngineMismatch = "tree-node-engine-mismatch"
}

interface UpgradeEvaluator {
    readonly name: string;
    evaluate(context: UpgradeEvaluationContext): Promise<EvaluatorDiagnostics>;
}

interface UpgradeEvaluatorFactoryOptions {
    runtimeEnvironment: RuntimeEnvironment | null;
    includePrerelease: boolean;
    allowDeprecatedPackages: boolean;
    minimumReleaseAgeMs: number | null;
}
declare class UpgradeEvaluatorFactory {
    create(options: UpgradeEvaluatorFactoryOptions): UpgradeEvaluator[];
}

declare class ProjectDependencyDeclarations {
    private readonly declarations;
    constructor(declarations: ProjectDependencyDeclaration[]);
    getAll(): ProjectDependencyDeclaration[];
    getProduction(): ProjectDependencyDeclaration[];
    getDevelopment(): ProjectDependencyDeclaration[];
    getPeer(): ProjectDependencyDeclaration[];
    getOptional(): ProjectDependencyDeclaration[];
    getPackageDependencies(): ProjectPackageDependency[];
    getRequirements(): DependencyRequirement[];
    getDependencyDeclarations(): DependencyDeclaration[];
    private getByKind;
    private uniqueRequirements;
    private uniquePackageDependencies;
    private uniqueDependencyDeclarations;
}

declare class ResolvedProjectDependencies {
    private readonly resolutions;
    constructor(resolutions: ResolvedProjectDependency[]);
    getAll(): ResolvedProjectDependency[];
    getDeclarations(): ProjectDependencyDeclarations;
    getRequirements(): DependencyRequirement[];
    getPackageDependencies(): ProjectPackageDependency[];
    getDependencyDeclarations(): DependencyDeclaration[];
    getResolvedDependencies(): Dependency[];
    private uniqueResolvedDependencies;
}

declare class ProjectDependencies {
    private readonly classification;
    constructor(classification: ProjectDependencyClassification);
    getSupportedProjectDependencies(): SupportedProjectDependency[];
    getUnsupportedProjectDependencies(): UnsupportedProjectDependency[];
    getAllProjectDependencies(): ProjectDependencyClassification;
    getSupportedResolutions(): ResolvedProjectDependencies;
    getUnsupportedResolutions(): ResolvedProjectDependencies;
    getAllResolutions(): ResolvedProjectDependencies;
    getResolvedDependencies(): Dependency[];
    getSupportedResolvedDependencies(): Dependency[];
    getUnsupportedResolvedDependencies(): Dependency[];
    getDeclarations(): ProjectDependencyDeclarations;
    getSupportedDeclarations(): ProjectDependencyDeclarations;
    getUnsupportedDeclarations(): ProjectDependencyDeclarations;
    getPackageDependencies(): ProjectPackageDependency[];
    getSupportedPackageDependencies(): ProjectPackageDependency[];
    getUnsupportedPackageDependencies(): ProjectPackageDependency[];
    getRequirements(): DependencyRequirement[];
    getSupportedRequirements(): DependencyRequirement[];
    getUnsupportedRequirements(): DependencyRequirement[];
    getDependencyDeclarations(): DependencyDeclaration[];
    getSupportedDependencyDeclarations(): DependencyDeclaration[];
    getUnsupportedDependencyDeclarations(): DependencyDeclaration[];
}

interface WorkspacePackage {
    name: string;
    path: string;
    version: string;
}
interface WorkspaceDependencySpecifier {
    versionSpecifier: string;
    explicitWorkspace: boolean;
}
declare enum WorkspaceProviderType {
    Npm = "npm"
}

interface DependencyResolution<TSourceType> {
    requirement: DependencyRequirement;
    sourceType: TSourceType;
}

interface DependencyRequirementAdapter<TSourceType> {
    normalize(packageName: string, packageSpecifier: string): DependencyResolution<TSourceType>;
}

declare class RegistryDependencyRequirementAdapter implements DependencyRequirementAdapter<DependencySourceType> {
    normalize(packageName: string, packageSpecifier: string): DependencyResolution<DependencySourceType>;
    private toDependencySourceType;
}

declare class WorkspaceDependencySpecifierParser {
    parse(packageSpecifier: string): WorkspaceDependencySpecifier;
}

interface GetWorkspacePackagesOptions {
    projectPath: string;
}
interface WorkspacePackageProvider {
    getPackages(options: GetWorkspacePackagesOptions): Promise<WorkspacePackage[]>;
}

declare class NpmWorkspacePackageProvider implements WorkspacePackageProvider {
    getPackages(options: GetWorkspacePackagesOptions): Promise<WorkspacePackage[]>;
}

declare class WorkspacePackageProviderFactory {
    private readonly npmWorkspacePackageProvider;
    constructor(npmWorkspacePackageProvider: NpmWorkspacePackageProvider);
    create(type: WorkspaceProviderType): WorkspacePackageProvider;
}

interface BuildWorkspaceProjectDependencyRequirementAdapterOptions {
    projectPath: string;
    workspaceProviderType: WorkspaceProviderType;
}
declare class ProjectDependencyRequirementAdapterProvider {
    private readonly registryDependencyRequirementAdapter;
    private readonly workspacePackageProviderFactory;
    private readonly workspaceDependencySpecifierParser;
    constructor(registryDependencyRequirementAdapter: RegistryDependencyRequirementAdapter, workspacePackageProviderFactory: WorkspacePackageProviderFactory, workspaceDependencySpecifierParser: WorkspaceDependencySpecifierParser);
    buildRegistryAdapter(): DependencyRequirementAdapter<ProjectDependencySourceType>;
    buildWorkspaceAdapter(options: BuildWorkspaceProjectDependencyRequirementAdapterOptions): Promise<DependencyRequirementAdapter<ProjectDependencySourceType>>;
}

declare enum ProjectOnlyDependencyKind {
    Development = "development"
}
type ProjectDependencyKind = PackageDependencyKind | ProjectOnlyDependencyKind;
interface ProjectDependencyDeclaration {
    dependency: ProjectPackageDependency;
    kind: ProjectDependencyKind;
}
interface ResolvedProjectDependency {
    declaration: ProjectDependencyDeclaration;
    dependency: Dependency;
}
declare enum UnsupportedProjectDependencyReason {
    UnsupportedRegistrySpecifier = "unsupported-registry-specifier",
    DependencyNotResolved = "dependency-not-resolved"
}
interface UnsupportedProjectDependency {
    resolution: ResolvedProjectDependency;
    reason: UnsupportedProjectDependencyReason;
}
interface SupportedProjectDependency {
    resolution: ResolvedProjectDependency;
}
interface ProjectDependencyClassification {
    supported: SupportedProjectDependency[];
    unsupported: UnsupportedProjectDependency[];
}
declare enum ProjectDependencyTreeSourceType {
    Registry = "registry",
    Lock = "lock"
}
declare enum ProjectDependencyLockFileType {
    PackageLock = "package-lock"
}
interface ProjectDependencyContext {
    originalTree: DependencyTree;
    projectDependencies: ProjectDependencies;
}
declare enum ProjectDependencySource {
    Workspace = "workspace"
}
type ProjectDependencySourceType = DependencySourceType | ProjectDependencySource;
interface ProjectPackageDependency {
    declaration: DependencyDeclaration;
    requirement: DependencyRequirement;
    sourceType: ProjectDependencySourceType;
}
interface ProjectPackageManifest {
    name: PackageName;
    version: PackageVersion;
    dependencies: ProjectPackageDependency[];
    peerDependencies: ProjectPackageDependency[];
    optionalDependencies: ProjectPackageDependency[];
    devDependencies: ProjectPackageDependency[];
}
declare enum ProjectDependencyRequirementAdapterType {
    Registry = "registry",
    Workspace = "workspace"
}
interface RegistryProjectDependencyRequirementAdapterProviderOptions {
    type: ProjectDependencyRequirementAdapterType.Registry;
}
interface WorkspaceProjectDependencyRequirementAdapterProviderOptions {
    type: ProjectDependencyRequirementAdapterType.Workspace;
    options: BuildWorkspaceProjectDependencyRequirementAdapterOptions;
}
type ProjectDependencyRequirementAdapterProviderOptions = RegistryProjectDependencyRequirementAdapterProviderOptions | WorkspaceProjectDependencyRequirementAdapterProviderOptions;
interface RegistryProjectDependencyRequirementConfiguration {
    type: ProjectDependencyRequirementAdapterType.Registry;
}
interface WorkspaceProjectDependencyRequirementConfiguration {
    type: ProjectDependencyRequirementAdapterType.Workspace;
    workspaceProviderType: WorkspaceProviderType;
}
type ProjectDependencyRequirementConfiguration = RegistryProjectDependencyRequirementConfiguration | WorkspaceProjectDependencyRequirementConfiguration;

interface ProjectDependencyRequirementAdapterContext {
    projectPath: string;
    configuration: ProjectDependencyRequirementConfiguration;
}
declare class ProjectDependencyRequirementAdapterProviderOptionsResolver {
    resolve(context: ProjectDependencyRequirementAdapterContext): ProjectDependencyRequirementAdapterProviderOptions;
}

interface CreateProjectDependencyRequirementAdapterOptions {
}
declare class ProjectDependencyRequirementAdapterFactory {
    private readonly optionsResolver;
    private readonly provider;
    constructor(optionsResolver: ProjectDependencyRequirementAdapterProviderOptionsResolver, provider: ProjectDependencyRequirementAdapterProvider);
    create(context: ProjectDependencyRequirementAdapterContext): Promise<DependencyRequirementAdapter<ProjectDependencySourceType>>;
}

declare const ProjectPackageManifestSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    dependencies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    peerDependencies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    optionalDependencies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    devDependencies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strip>;
type RawProjectPackageManifest = z.infer<typeof ProjectPackageManifestSchema>;

/**
 * IMPORTANT:
 *
 * RegistryDependencyRequirementAdapter assumes
 * the project does not use workspaces.
 *
 * Workspace projects must use
 * ProjectDependencyRequirementAdapter.
 */
declare class ProjectPackageManifestAdapter {
    private readonly dependencyRequirementAdapter;
    constructor(dependencyRequirementAdapter: DependencyRequirementAdapter<ProjectDependencySourceType | DependencySourceType>);
    normalize(manifest: RawProjectPackageManifest): ProjectPackageManifest;
    private normalizeDependencies;
}

interface GetProjectPackageManifestAdapterOptions {
    projectPath: string;
    dependencyRequirementConfiguration: ProjectDependencyRequirementConfiguration;
}
declare class ProjectPackageManifestAdapterProvider {
    private readonly dependencyRequirementAdapterFactory;
    constructor(dependencyRequirementAdapterFactory: ProjectDependencyRequirementAdapterFactory);
    getAdapter(options: GetProjectPackageManifestAdapterOptions): Promise<ProjectPackageManifestAdapter>;
}

interface ReadProjectManifestOptions {
    projectDirectory: string;
    dependencyRequirementConfiguration: ProjectDependencyRequirementConfiguration;
}
declare class ProjectManifestReader {
    private projectPackageManifestAdapterProvider;
    constructor(projectPackageManifestAdapterProvider: ProjectPackageManifestAdapterProvider);
    read(options: ReadProjectManifestOptions): Promise<ProjectPackageManifest>;
}

interface CollectProjectDependenciesOptions {
    manifest: ProjectPackageManifest;
}
declare class ProjectDependencyCollector {
    collect(options: CollectProjectDependenciesOptions): ProjectDependencyDeclarations;
    private collectDependencyMap;
}

interface GetProjectDeclarationsOptions {
    projectPath: string;
    dependencyRequirementConfiguration: ProjectDependencyRequirementConfiguration;
}
declare class ProjectDependencyProvider {
    private manifestReader;
    private dependencyCollector;
    constructor(manifestReader: ProjectManifestReader, dependencyCollector: ProjectDependencyCollector);
    getDeclarations(options: GetProjectDeclarationsOptions): Promise<ProjectDependencyDeclarations>;
}

interface ResolveProjectDependenciesOptions {
    dependencies: ProjectDependencyDeclarations;
    tree: DependencyTree;
}
declare class ProjectDependencyResolver {
    constructor();
    resolve(options: ResolveProjectDependenciesOptions): Promise<ResolvedProjectDependencies>;
}

declare class DependencyGraph {
    private nodes;
    ensureNode(dependency: Dependency): DependencyNodeId;
    linkDependency(edge: DependencyEdge): void;
    hasNode(id: DependencyNodeId): boolean;
    getNode(id: DependencyNodeId): DependencyGraphNode;
    getAllNodes(): DependencyGraphNode[];
}

declare class SelectedPackageDependencies {
    private dependencies;
    constructor(dependencies: PackageDependency[]);
    getDependencies(): PackageDependency[];
    getRequirements(): DependencyRequirement[];
    getDeclarations(): DependencyDeclaration[];
}

interface PackageManifestDependencySelectorOptions {
    includedDependencyKinds: ReadonlySet<PackageDependencyKind>;
}
declare class PackageManifestDependencySelector {
    private options;
    constructor(options: PackageManifestDependencySelectorOptions);
    select(manifest: PackageManifest): SelectedPackageDependencies;
}

interface AttachPackageOptions {
    packageIdentifier: string;
    version: string;
}
interface AttachManifestOptions {
    manifest: PackageManifest;
}
interface ExpandDependenciesOptions {
    dependencies: DependencyRequirement[];
    dependentId: DependencyNodeId | null;
}
interface AttachDependencyOptions {
    dependency: Dependency;
    dependentId: DependencyNodeId | null;
    metadata: RegistryPackageMetadata;
}
interface ProvideDependencyGraphOptions {
    dependencies: DependencyRequirement[];
}
declare class RegistryDependencyExpander {
    private metadataRegistry;
    private packageManifestDependencySelector;
    private resolving;
    private expanded;
    private graph;
    constructor(metadataRegistry: PackageMetadataRegistry, packageManifestDependencySelector: PackageManifestDependencySelector);
    expand(options: ProvideDependencyGraphOptions): Promise<DependencyGraph>;
    attachPackage(options: AttachPackageOptions): Promise<DependencyGraph>;
    attachManifest(options: AttachManifestOptions): Promise<DependencyGraph>;
    attachDependencies(dependencies: DependencyRequirement[]): Promise<DependencyGraph>;
    private collectManifestDependencies;
    private expandDependencies;
    private attachDependency;
    getGraph(): DependencyGraph;
}

declare class RegistryDependencyExpanderProvider {
    private metadataRegistry;
    private dependencySelector;
    constructor(metadataRegistry: PackageMetadataRegistry, dependencySelector: PackageManifestDependencySelector);
    createExpander(): RegistryDependencyExpander;
}

interface BuildRegistryDependencyGraphOptions {
    dependencies: DependencyRequirement[];
}
declare class ProjectRegistryDependencyGraphBuilder {
    private expanderProvider;
    constructor(expanderProvider: RegistryDependencyExpanderProvider);
    build(options: BuildRegistryDependencyGraphOptions): Promise<DependencyGraph>;
}

interface ProjectDependencyLockFileResolver {
    readonly type: ProjectDependencyLockFileType;
    getLockFileName(): string;
    resolveLockFilePath(projectPath: string): string;
    exists(projectPath: string): boolean;
}

declare class ProjectLockDependencyBuilderResolver {
    private resolvers;
    constructor(resolvers: ProjectDependencyLockFileResolver[]);
    resolve(projectPath: string): Promise<ProjectDependencyLockFileType>;
}

interface BuildLockDependencyGraphProviderOptions {
    projectPath: string;
    dependencyRequirementAdapter: DependencyRequirementAdapter<ProjectDependencySourceType>;
}
interface LockDependencyGraphProvider {
    readonly type: ProjectDependencyLockFileType;
    build(options: BuildLockDependencyGraphProviderOptions): Promise<DependencyGraph>;
}

declare class ProjectDependencyLockFileToWorkspaceProviderMapper {
    resolve(lockFileType: ProjectDependencyLockFileType): WorkspaceProviderType;
    private assertUnreachable;
}

interface ValidateProjectDependencyRequirementConfigurationOptions {
    configuration: ProjectDependencyRequirementConfiguration;
    lockFileType: ProjectDependencyLockFileType;
}
declare class ProjectDependencyRequirementConfigurationValidator {
    private readonly workspaceProviderMapper;
    constructor(workspaceProviderMapper: ProjectDependencyLockFileToWorkspaceProviderMapper);
    validate(options: ValidateProjectDependencyRequirementConfigurationOptions): void;
}

interface BuildLockDependencyGraphOptions {
    projectPath: string;
    dependencyRequirementConfiguration: ProjectDependencyRequirementConfiguration;
}
declare class ProjectLockDependencyGraphBuilder {
    private builderResolver;
    private builders;
    private dependencyRequirementAdapterFactory;
    private configurationValidator;
    constructor(builderResolver: ProjectLockDependencyBuilderResolver, builders: LockDependencyGraphProvider[], dependencyRequirementAdapterFactory: ProjectDependencyRequirementAdapterFactory, configurationValidator: ProjectDependencyRequirementConfigurationValidator);
    build(options: BuildLockDependencyGraphOptions): Promise<DependencyGraph>;
}

interface ExpandGraphOptions {
    graph: DependencyGraph;
}
declare class DependencyTreeSession {
    private metadataRegistry;
    private tree;
    constructor(metadataRegistry: PackageMetadataRegistry);
    expandGraph(options: ExpandGraphOptions): Promise<void>;
    private attachNodes;
    private attachEdges;
    getTree(): DependencyTree;
}

declare class DependencyTreeSessionProvider {
    private metadataRegistry;
    constructor(metadataRegistry: PackageMetadataRegistry);
    createSession(): DependencyTreeSession;
}

interface RegistryDependencyTreeBuildOptions {
    requirements: DependencyRequirement[];
}
interface LockDependencyTreeBuildOptions {
    projectPath: string;
    dependencyRequirementConfiguration: ProjectDependencyRequirementConfiguration;
}
declare class ProjectDependencyTreeProvider {
    private dependencyTreeSessionProvider;
    private registryBuilder;
    private lockBuilder;
    constructor(dependencyTreeSessionProvider: DependencyTreeSessionProvider, registryBuilder: ProjectRegistryDependencyGraphBuilder, lockBuilder: ProjectLockDependencyGraphBuilder);
    buildFromRegistry(options: RegistryDependencyTreeBuildOptions): Promise<DependencyTree>;
    buildFromLock(options: LockDependencyTreeBuildOptions): Promise<DependencyTree>;
    private buildTree;
}

interface ClassifyProjectDependenciesOptions {
    dependencies: ResolvedProjectDependencies;
    supportedSources: ProjectDependencySourceType[];
}
declare class ProjectDependencySupportClassifier {
    constructor();
    classify(options: ClassifyProjectDependenciesOptions): ProjectDependencies;
}

interface ProjectDependencyTreeContext {
    projectPath: string;
    treeSourceType: ProjectDependencyTreeSourceType;
    declarations: ProjectDependencyDeclarations;
    dependencyRequirementConfiguration: ProjectDependencyRequirementConfiguration;
}
interface BuildProjectDependencyContextOptions {
    projectPath: string;
    treeSourceType: ProjectDependencyTreeSourceType;
    supportedSources: DependencySourceType[];
    dependencyRequirementConfiguration: ProjectDependencyRequirementConfiguration;
}
interface ProjectDependencyContextProviderOptions {
}
declare class ProjectDependencyContextProvider {
    private dependencyProvider;
    private dependencyResolver;
    private dependencyTreeProvider;
    private supportClassifier;
    constructor(dependencyProvider: ProjectDependencyProvider, dependencyResolver: ProjectDependencyResolver, dependencyTreeProvider: ProjectDependencyTreeProvider, supportClassifier: ProjectDependencySupportClassifier);
    build(options: BuildProjectDependencyContextOptions): Promise<ProjectDependencyContext>;
    private buildTree;
}

interface DependencyChainNode {
    identifier: string;
    version: string;
    metadata: RegistryPackageMetadata;
}
/**
 * Chain direction:
 *
 * root -> ... -> target
 *
 * nodes.at(0)     = root dependency
 * nodes.at(-1)= target dependency
 */
interface DependencyChain {
    nodes: DependencyChainNode[];
}
interface DependencyChangeNode {
    node: DependencyTreeNode;
    chains: DependencyChain[];
}
interface AddedDependencyChange extends DependencyChangeNode {
}
interface RemovedDependencyChange extends DependencyChangeNode {
}
interface ChangedDependencyChange {
    packageIdentifier: string;
    previous: DependencyChangeNode[];
    next: DependencyChangeNode[];
}
interface DependencyVersionChange {
    packageIdentifier: string;
    previous: DependencyTreeNode[];
    next: DependencyTreeNode[];
}
interface DependencyTreeChangeAnalysis {
    added: DependencyTreeNode[];
    removed: DependencyTreeNode[];
    changed: DependencyVersionChange[];
}
interface DependencyTransparencyReport {
    added: AddedDependencyChange[];
    removed: RemovedDependencyChange[];
    changed: ChangedDependencyChange[];
}

interface ResolveChainsContext {
    tree: DependencyTree;
    targetNodeId: DependencyNodeId;
}
interface ToDependencyChainOptions {
    tree: DependencyTree;
    nodeIds: DependencyNodeId[];
}
declare class DependencyChainResolver {
    constructor();
    resolveChains(ctx: ResolveChainsContext): DependencyChain[];
    private toDependencyChain;
}

interface AnalyzeDependencyUpgradePlanningOptions {
    dependencies: RegistryDependency[];
    planningPolicy: UpgradePlanningPolicy;
}
declare enum UpgradePlanningFailureReason {
    IncompatibleNodeVersion = "incompatible-node-version",
    NoCompatibleVersion = "no-compatible-version",
    DisallowedDependencySource = "disallowed-dependency-source"
}
interface DependencyUpgradeableResult {
    dependency: RegistryDependency;
    candidate: RegistryPackageMetadata;
}
interface DependencyUnresolvedResult {
    dependency: RegistryDependency;
    reason: UpgradePlanningFailureReason;
}
interface DependencyUpgradePlanningResult {
    upgradeables: DependencyUpgradeableResult[];
    unresolved: DependencyUnresolvedResult[];
}
interface UpgradePlanningPolicy {
    disallowedDependencySources: DependencySourceType[];
    forbiddenRequirements: DependencyRequirement[];
}

interface UpgradePlanningContext {
    metadataRegistry: PackageMetadataRegistry;
    forbiddenRequirements: DependencyRequirement[];
    disallowedDependencySources: DependencySourceType[];
    dependency: RegistryDependency;
}

interface UpgradeCandidateResolution {
    selected: UpgradeEvaluationResult | null;
    rejected: UpgradeEvaluationResult[];
}
interface UpgradePlanResolution {
    context: UpgradePlanningContext;
    candidateResolution: UpgradeCandidateResolution;
}
interface ResolveUpgradeCandidateOptions {
    context: UpgradePlanningContext;
    candidates: AsyncIterable<UpgradeCandidate>;
}

interface AnalyzeDependencyUpgradeOptions {
    planningResults: UpgradePlanResolution[];
}
declare class DependencyUpgradeAnalyzer {
    constructor();
    analyze(options: AnalyzeDependencyUpgradeOptions): Promise<DependencyUpgradeableResult[]>;
    private getUpgradeables;
}

declare enum VulnerabilitySeverity {
    Low = "low",
    Moderate = "moderate",
    High = "high",
    Critical = "critical"
}
interface VulnerabilityAdvisory {
    id: string;
    packageName: string;
    title: string;
    severity: VulnerabilitySeverity;
    vulnerableRange: string;
    url: string;
}
/**
 * Computed summary derived from
 * all matching advisories for
 * a vulnerable dependency.
 */
interface Vulnerability {
    id: string;
    packageName: string;
    vulnerableRange: string;
    severity: VulnerabilitySeverity;
    advisories: VulnerabilityAdvisory[];
}
interface VulnerableDependency {
    vulnerability: Vulnerability;
    chains: DependencyChain[];
    node: DependencyTreeNode;
}
interface ReachableRootDependencyVulnerability {
    rootDependency: Dependency;
    vulnerabilities: VulnerableDependency[];
}
interface VulnerabilityRootReachabilityClassification {
    reachable: ReachableRootDependencyVulnerability[];
    unreachable: VulnerableDependency[];
}
interface SupportedReachableVulnerability {
    rootDependency: RegistryDependency;
    vulnerabilities: VulnerableDependency[];
}
interface UnsupportedReachableVulnerability {
    rootDependency: Dependency;
    vulnerabilities: VulnerableDependency[];
}
interface ReachableVulnerabilitySupportClassification {
    supported: SupportedReachableVulnerability[];
    unsupported: UnsupportedReachableVulnerability[];
}
interface VulnerabilityAnalysisResult {
    reachability: VulnerabilityRootReachabilityClassification;
    supportability: ReachableVulnerabilitySupportClassification;
}

declare enum SharedUnresolvedReason {
    IncompatibleNodeVersion = "incompatible-node-version",
    DisallowedDependencySource = "disallowed-dependency-source"
}
declare enum LatestUnresolvedReason {
    NoNewerVersion = "no-newer-version",
    AlreadyLatest = "already-latest"
}
declare enum SecurityUnresolvedReason {
    NoPatchAvailable = "NO_PATCH_AVAILABLE"
}
declare enum VulnerabilityDependencyRemovableReason {
    UnreachableFromRootDependency = "not-reachable-from-project"
}
declare enum VulnerabilityDependencyUnsupportedReason {
    RootDependencyNotUpgradeable = "root-dependency-not-upgradeable"
}
type SecurityUnresolvedResultReason = SharedUnresolvedReason | SecurityUnresolvedReason;
type LatestUnresolvedResultReason = SharedUnresolvedReason | LatestUnresolvedReason;
interface UpgradePlanningDependencyUnresolvedResult<TReason> {
    dependency: RegistryDependency;
    reason: TReason;
}
interface RemovableVulnerabilityReport {
    vulnerability: VulnerableDependency;
    reason: VulnerabilityDependencyRemovableReason;
}
interface SupportedRootDependencyVulnerabilityReport {
    rootDependency: RegistryDependency;
    vulnerabilities: VulnerableDependency[];
}
interface UnsupportedRootDependencyVulnerabilityReport {
    rootDependency: Dependency;
    vulnerabilities: VulnerableDependency[];
    reason: VulnerabilityDependencyUnsupportedReason;
}
interface DependencyVulnerabilityAnalysisResult {
    supported: SupportedRootDependencyVulnerabilityReport[];
    removables: RemovableVulnerabilityReport[];
    unsupported: UnsupportedRootDependencyVulnerabilityReport[];
}
interface DependencyUpgradeableAnalysis {
    upgradeables: DependencyUpgradeableResult[];
    transparency: DependencyTransparencyReport;
}
interface DependencyUpgradeAnalysisResult<TUnresolvedReason> {
    upgradeableAnalysis: DependencyUpgradeableAnalysis;
    unresolved: UpgradePlanningDependencyUnresolvedResult<TUnresolvedReason>[];
}
interface SecurityAuditResult {
    upgradeAnalysis: DependencyUpgradeAnalysisResult<SecurityUnresolvedResultReason>;
    vulnerabilityAnalysis: DependencyVulnerabilityAnalysisResult;
}
interface LatestAuditResult {
    upgradeAnalysis: DependencyUpgradeAnalysisResult<LatestUnresolvedResultReason>;
}

interface ResolveSharedUnresolvedReasonOptions {
    reason: UpgradePlanningFailureReason;
}
declare class SharedUnresolvedReasonResolver {
    resolve(options: ResolveSharedUnresolvedReasonOptions): SharedUnresolvedReason | null;
}

interface ValidateForbiddenDependenciesOptions {
    tree: DependencyTree;
    forbiddenDependencies: DependencyRequirement[];
}
declare class ForbiddenDependencyConstraintValidator {
    validate(options: ValidateForbiddenDependenciesOptions): Promise<ConstraintValidationResult>;
    private matchesRequirement;
}

interface ValidateDependencySourcesOptions {
    tree: DependencyTree;
    disallowedDependencySources: DependencySourceType[];
}
declare class DependencySourceConstraintValidator {
    private packageManifestDependencySelector;
    constructor(packageManifestDependencySelector: PackageManifestDependencySelector);
    validate(options: ValidateDependencySourcesOptions): Promise<ConstraintValidationResult>;
}

interface PlanningConstraintEngineOptions {
    planningContext: UpgradePlanningContext;
    candidateDependencyTree: DependencyTree;
}
declare class PlanningConstraintEngine {
    private forbiddenDependencyValidator;
    private dependencySourceValidator;
    constructor(forbiddenDependencyValidator: ForbiddenDependencyConstraintValidator, dependencySourceValidator: DependencySourceConstraintValidator);
    validate(options: PlanningConstraintEngineOptions): Promise<ConstraintValidationResult[]>;
}

declare class UpgradeEvaluationPipeline {
    private readonly evaluators;
    register(evaluator: UpgradeEvaluator): void;
    evaluate(context: UpgradeEvaluationContext): Promise<UpgradeEvaluationDiagnostics>;
}

interface BuildDependencyTreeOptions {
    dependencies: DependencyRequirement[];
}
declare class DependencyTreeAssembler {
    private expanderProvider;
    private sessionProvider;
    constructor(expanderProvider: RegistryDependencyExpanderProvider, sessionProvider: DependencyTreeSessionProvider);
    build(options: BuildDependencyTreeOptions): Promise<DependencyTree>;
}

declare class CandidateDependencyTreeBuilder {
    private dependencyTreeAssembler;
    constructor(dependencyTreeAssembler: DependencyTreeAssembler);
    build(rootDependency: Dependency): Promise<DependencyTree>;
}

interface UpgradeEvaluationPolicyOptions {
    invalidSeverities: EvaluatorDiagnosticSeverity[];
}
declare class UpgradeEvaluationPolicy {
    private invalidSeverities;
    constructor(options: UpgradeEvaluationPolicyOptions);
    acceptDiagnostic(diagnostic: EvaluatorDiagnostic): boolean;
    acceptDiagnostics(diagnostics: EvaluatorDiagnostic[]): boolean;
}

interface UpgradeEvaluationOptions {
    planningContext: UpgradePlanningContext;
    candidate: UpgradeCandidate;
}
declare class UpgradeEvaluationEngine {
    private planningConstraintEngine;
    private pipeline;
    private dependencyTreeBuilder;
    private policy;
    constructor(planningConstraintEngine: PlanningConstraintEngine, pipeline: UpgradeEvaluationPipeline, dependencyTreeBuilder: CandidateDependencyTreeBuilder, policy: UpgradeEvaluationPolicy);
    evaluate(options: UpgradeEvaluationOptions): Promise<UpgradeEvaluationResult>;
}

declare class UpgradeCandidateResolver {
    private evaluationEngine;
    constructor(evaluationEngine: UpgradeEvaluationEngine);
    resolve(options: ResolveUpgradeCandidateOptions): Promise<UpgradeCandidateResolution>;
}

interface VulnerabilityAdvisoryEntry {
    id: string;
    title: string;
    severity: VulnerabilitySeverity;
    vulnerableRange: string;
    url: string;
}
interface DependencyChainNodeEntry {
    packageName: string;
    identifier: string;
    version: string;
}
interface VulnerabilityEntry {
    id: string;
    packageName: string;
    currentVersion: string;
    severity: VulnerabilitySeverity;
    chains: DependencyChainNodeEntry[][];
    advisoryIds: string[];
}
interface SupportedRootDependencyVulnerabilityEntry {
    packageName: string;
    currentVersion: string;
    vulnerabilityIds: string[];
}
interface UnsupportedRootDependencyVulnerabilityEntry {
    identifier: string;
    currentVersion: string;
    vulnerabilityIds: string[];
    reason: VulnerabilityDependencyUnsupportedReason;
}
interface RemovableDependencyVulnerabilityEntry {
    vulnerabilityId: string;
    packageName: string;
    version: string;
    reason: VulnerabilityDependencyRemovableReason;
}
interface VulnerabilitySection {
    vulnerabilities: VulnerabilityEntry[];
    advisories: VulnerabilityAdvisoryEntry[];
    supportedRootDependencies: SupportedRootDependencyVulnerabilityEntry[];
    unsupportedRootDependencies: UnsupportedRootDependencyVulnerabilityEntry[];
    removableDependencies: RemovableDependencyVulnerabilityEntry[];
}

interface UpgradeableEntry {
    packageName: string;
    currentVersion: string;
    targetPublishedAtMs: number | null;
    targetDistTags: string[];
    targetVersion: string;
}
interface UnresolvedEntry<TReason> {
    packageName: string;
    version: string;
    reason: TReason;
}
declare enum TransparencyChangeType {
    Added = "added",
    Removed = "removed"
}
interface TransparencyDependency {
    packageName: string;
    identifier: string;
    version: string;
    publishedAtMs: number | null;
}
interface TransparencyEntry extends TransparencyDependency {
    requiredByChains: TransparencyDependency[][];
    changeType: TransparencyChangeType;
}
interface UpgradeAnalysisSection<TUnresolvedReason> {
    upgradeables: UpgradeableEntry[];
    unresolved: UnresolvedEntry<TUnresolvedReason>[];
    transparency: TransparencyEntry[];
}

interface AuditSection {
    projectDirectory: string;
    dependencyTreeSourceType: ProjectDependencyTreeSourceType;
    disallowedDependencySources: DependencySourceType[];
}

interface SupportedProjectDependencyEntry {
    packageName: string;
    specifier: string;
    declaredName: string;
    declaredSpecifier: string;
    version: string;
    kind: ProjectDependencyKind;
}
interface UnsupportedProjectDependencyEntry {
    declaredSpecifier: string;
    declaredName: string;
    identifier: string;
    specifier: string;
    version: string;
    kind: ProjectDependencyKind;
    reason: UnsupportedProjectDependencyReason;
}
interface ProjectDependenciesSection {
    supported: SupportedProjectDependencyEntry[];
    unsupported: UnsupportedProjectDependencyEntry[];
}

/**
 * Package identifier used by the workflow.
 * This may be a registry package name,
 * git URL, file path, etc.
 */
declare enum ReportType {
    Security = "security",
    Latest = "latest"
}
interface ReportMetadata {
    id: string;
    generatedAtMs: number;
}
interface Report extends ReportMetadata {
    projectDependencies: ProjectDependenciesSection;
    audit: AuditSection;
}
interface SecurityReport extends Report {
    type: ReportType.Security;
    upgradeAnalysis: UpgradeAnalysisSection<SecurityUnresolvedResultReason>;
    vulnerabilities: VulnerabilitySection;
}
interface LatestReport extends Report {
    type: ReportType.Latest;
    upgradeAnalysis: UpgradeAnalysisSection<LatestUnresolvedResultReason>;
}
type AuditReport = SecurityReport | LatestReport;

interface BuildReportMetadataOptions {
    type: ReportType;
}
declare class ReportMetadataBuilder {
    constructor();
    build(options: BuildReportMetadataOptions): ReportMetadata;
}

interface DependencyAuditWorkflowContext {
    projectPath: string;
    projectDependencyTreeSourceType: ProjectDependencyTreeSourceType;
    disallowedDependencySources: DependencySourceType[];
    projectDependencyRequirementConfiguration: ProjectDependencyRequirementConfiguration;
}
interface DependencyAuditWorkflow<TResult> {
    execute(ctx: DependencyAuditWorkflowContext): Promise<TResult>;
}

interface BuildAuditSectionOptions {
    context: DependencyAuditWorkflowContext;
}
declare class AuditSectionBuilder {
    build(options: BuildAuditSectionOptions): AuditSection;
}

interface BuildUpgradeableSectionOptions {
    upgradeables: DependencyUpgradeableResult[];
}
declare class UpgradeableSectionBuilder {
    build(options: BuildUpgradeableSectionOptions): UpgradeableEntry[];
}

interface BuildTransparencySectionOptions {
    transparency: DependencyTransparencyReport;
}
declare class TransparencySectionBuilder {
    build(options: BuildTransparencySectionOptions): TransparencyEntry[];
    private buildRequireChains;
    private filterTransitiveChains;
}

interface BuildProjectDependenciesSectionOptions {
    projectDependencies: ProjectDependencies;
}
declare class ProjectDependenciesSectionBuilder {
    build(options: BuildProjectDependenciesSectionOptions): ProjectDependenciesSection;
}

interface UpgradePlanningContextBuildOptions {
    policy: UpgradePlanningPolicy;
    dependencies: RegistryDependency[];
}
declare class UpgradePlanningContextBuilder {
    private metadataRegistry;
    constructor(metadataRegistry: PackageMetadataRegistry);
    build(options: UpgradePlanningContextBuildOptions): UpgradePlanningContext[];
}

declare class DependencyUnresolvedReasonResolver {
    resolve(rejected: UpgradeEvaluationResult[]): UpgradePlanningFailureReason;
}

interface AnalyzeDependencyUnresolvedOptions {
    planningResults: UpgradePlanResolution[];
}
declare class DependencyUnresolvedAnalyzer {
    private reasonResolver;
    constructor(reasonResolver: DependencyUnresolvedReasonResolver);
    analyze(options: AnalyzeDependencyUnresolvedOptions): DependencyUnresolvedResult[];
}

interface ExecuteUpgradePlanningRemediationOptions {
    planningResults: UpgradePlanResolution[];
}
declare class UpgradePlanningRemediation {
    private upgradeAnalyzer;
    private unresolvedAnalyzer;
    constructor(upgradeAnalyzer: DependencyUpgradeAnalyzer, unresolvedAnalyzer: DependencyUnresolvedAnalyzer);
    execute(options: ExecuteUpgradePlanningRemediationOptions): Promise<DependencyUpgradePlanningResult>;
}

interface DependencyTreeDiff {
    added: DependencyTreeNode[];
    removed: DependencyTreeNode[];
}
declare class DependencyTreeDiffer {
    diff(previousTree: DependencyTree, nextTree: DependencyTree): DependencyTreeDiff;
}

declare class DependencyTreeTransitionAnalyzer {
    analyze(diff: DependencyTreeDiff): DependencyTreeChangeAnalysis;
    private groupByIdentifier;
}

interface DependencyTransparencyAnalyzerOptions {
    previousTree: DependencyTree;
    nextTree: DependencyTree;
}
declare class DependencyTransparencyAnalyzer {
    private differ;
    private changeAnalyzer;
    private chainResolver;
    constructor(differ: DependencyTreeDiffer, changeAnalyzer: DependencyTreeTransitionAnalyzer, chainResolver: DependencyChainResolver);
    analyze(options: DependencyTransparencyAnalyzerOptions): DependencyTransparencyReport;
    private buildAddedChanges;
    private buildRemovedChanges;
    private buildChangedChanges;
    private buildDependencyChangeNode;
}

interface AnalyzeDependencyUpgradeTransparencyOptions {
    originalTree: DependencyTree;
    upgradedDependencies: RegistryDependency[];
}
declare class DependencyUpgradeTransparencyAnalyzer {
    private dependencyTreeAssembler;
    private transparencyAnalyzer;
    constructor(dependencyTreeAssembler: DependencyTreeAssembler, transparencyAnalyzer: DependencyTransparencyAnalyzer);
    analyze(options: AnalyzeDependencyUpgradeTransparencyOptions): Promise<DependencyTransparencyReport>;
}

interface AnalyzeDependencyUpgradeableOptions {
    upgradeables: DependencyUpgradeableResult[];
    originalTree: DependencyTree;
}
declare class DependencyUpgradeableAnalyzer {
    private transparencyAnalyzer;
    constructor(transparencyAnalyzer: DependencyUpgradeTransparencyAnalyzer);
    analyze(options: AnalyzeDependencyUpgradeableOptions): Promise<DependencyUpgradeableAnalysis>;
}

interface CreateDependencyAuditWorkflowOptions {
    upgradeEvaluation: UpgradeEvaluatorFactoryOptions;
    dependencyExpansion: DependencyExpansionOptions;
}
interface DependencyExpansionOptions {
    includedDependencyKinds: PackageDependencyKind[];
}

interface CreateDependencyAuditContainerOptions {
    upgradeEvaluation: UpgradeEvaluatorFactoryOptions;
    dependencyExpansion: DependencyExpansionOptions;
}
interface DependencyAuditContainer {
    projectDependencyContextProvider: ProjectDependencyContextProvider;
    packageMetadataRegistry: PackageMetadataRegistry;
    dependencyChainResolver: DependencyChainResolver;
    upgradeCandidateResolver: UpgradeCandidateResolver;
    upgradePlanningContextBuilder: UpgradePlanningContextBuilder;
    dependencyUpgradeAnalyzer: DependencyUpgradeAnalyzer;
    reportMetadataBuilder: ReportMetadataBuilder;
    auditSectionBuilder: AuditSectionBuilder;
    upgradeableSectionBuilder: UpgradeableSectionBuilder;
    transparencySectionBuilder: TransparencySectionBuilder;
    projectDependenciesSectionBuilder: ProjectDependenciesSectionBuilder;
    upgradePlanningRemediation: UpgradePlanningRemediation;
    dependencyUpgradeableAnalyzer: DependencyUpgradeableAnalyzer;
    sharedUnresolvedReasonResolver: SharedUnresolvedReasonResolver;
}
declare function createDependencyAuditContainer(options: CreateDependencyAuditContainerOptions): Promise<DependencyAuditContainer>;

declare function createDependencyLatestAuditWorkflow(options: CreateDependencyAuditWorkflowOptions): Promise<DependencyAuditWorkflow<LatestReport>>;

declare function createDependencySecurityAuditWorkflow(options: CreateDependencyAuditWorkflowOptions): Promise<DependencyAuditWorkflow<SecurityReport>>;

interface ProjectDirectoryResolverOptions {
    workspaceRoot: string;
}
declare class ProjectDirectoryResolver {
    private options;
    constructor(options: ProjectDirectoryResolverOptions);
    resolveProjectDirectories(patterns: string[]): Promise<string[]>;
}

interface CreateProjectDirectoryResolverOptions {
    workspaceRoot: string;
}
declare function createProjectDirectoryResolver(options: CreateProjectDirectoryResolverOptions): Promise<ProjectDirectoryResolver>;

interface ReportRenderer<TReport extends AuditReport> {
    render(report: TReport): Promise<string>;
}

declare class ReportInformationSectionRenderer<TReport extends AuditReport> {
    render(report: TReport): string;
    private createRows;
}

interface VulnerabilitySeverityCounts {
    [VulnerabilitySeverity.Low]: number;
    [VulnerabilitySeverity.Moderate]: number;
    [VulnerabilitySeverity.High]: number;
    [VulnerabilitySeverity.Critical]: number;
}
declare class SummarySectionRenderer<TReport extends AuditReport> {
    render(report: TReport): string;
    private renderProjectSummary;
    private getProjectDependencyCount;
    private renderVulnerabilitySummary;
    private renderRootDependencyAnalysis;
    private getFullyRemediableCount;
    private renderSeveritySummary;
    private getVulnerabilitySeverityCounts;
}

declare class UnsupportedProjectDependenciesSectionRenderer<TReport extends AuditReport> {
    render(report: TReport): string | null;
}

declare class UpgradeableDependenciesSectionRenderer<TReport extends AuditReport> {
    render(report: TReport): string | null;
    private formatUpgradeableTargetVersion;
}

declare class VulnerabilitySectionRenderer {
    render(report: SecurityReport): string | null;
    private resolveVulnerabilityRows;
    private createVulnerabilityUnsupportedRows;
    private createVulnerabilityUpgradeRows;
    private createVulnerabilityRemoveRow;
    private createVulnerabilityUnresolvedRows;
}

declare class TransparencySectionRenderer<TReport extends AuditReport> {
    render(report: TReport): string | null;
    private getRequiredByRootDependencies;
}

declare class ActionSummarySectionRenderer<TReport extends AuditReport> {
    render(report: TReport): string | null;
    private renderUpgradeSummary;
    private renderRemoveSummary;
}

interface ConsoleReportRendererOptions {
    showTransparency: boolean;
}
declare class ConsoleReportRenderer<TReport extends AuditReport> implements ReportRenderer<TReport> {
    private reportInformationRenderer;
    private summaryRenderer;
    private unsupportedProjectDependenciesRenderer;
    private upgradeableDependenciesRenderer;
    private vulnerabilityRenderer;
    private transparencyRenderer;
    private actionSummaryRenderer;
    private options;
    constructor(reportInformationRenderer: ReportInformationSectionRenderer<TReport>, summaryRenderer: SummarySectionRenderer<TReport>, unsupportedProjectDependenciesRenderer: UnsupportedProjectDependenciesSectionRenderer<TReport>, upgradeableDependenciesRenderer: UpgradeableDependenciesSectionRenderer<TReport>, vulnerabilityRenderer: VulnerabilitySectionRenderer, transparencyRenderer: TransparencySectionRenderer<TReport>, actionSummaryRenderer: ActionSummarySectionRenderer<TReport>, options: ConsoleReportRendererOptions);
    render(report: TReport): Promise<string>;
}

declare enum ReportFormat {
    Console = "console",
    Json = "json"
}

interface ConsoleRendererFactoryOptions {
    type: ReportFormat.Console;
    rendererOptions: ConsoleReportRendererOptions;
}
interface JsonRendererFactoryOptions {
    type: ReportFormat.Json;
}
type ReportRendererFactoryOptions = ConsoleRendererFactoryOptions | JsonRendererFactoryOptions;
declare class ReportRendererFactory<TReport extends AuditReport> {
    constructor();
    create(options: ReportRendererFactoryOptions): ReportRenderer<TReport>;
    private assertUnreachable;
}

interface ContentWriter {
    write(content: string): Promise<void>;
}

declare enum ContentWriterType {
    Console = "console",
    File = "file"
}
interface ConsoleContentWriterFactoryOptions {
    type: ContentWriterType.Console;
    stream: NodeJS.WritableStream;
}
interface FileContentWriterFactoryOptions {
    type: ContentWriterType.File;
    filePath: string;
}
type ContentWriterFactoryOptions = ConsoleContentWriterFactoryOptions | FileContentWriterFactoryOptions;
declare class ContentWriterFactory {
    constructor();
    create(options: ContentWriterFactoryOptions): ContentWriter;
    private assertUnreachable;
}

declare class ReportWriter<TReport extends AuditReport> {
    private renderer;
    private writer;
    constructor(renderer: ReportRenderer<TReport>, writer: ContentWriter);
    write(report: TReport): Promise<void>;
}

interface CreateReportWriterOptions {
    renderer: ReportRendererFactoryOptions;
    writer: ContentWriterFactoryOptions;
}
declare function createReportWriter<TReport extends AuditReport>(options: CreateReportWriterOptions): ReportWriter<TReport>;

declare function createLatestCommand(): Command;
declare function createSecurityCommand(): Command;

declare const EXTERNAL_DEPENDENCY_SOURCES: readonly [DependencySourceType.File, DependencySourceType.Directory, DependencySourceType.Git, DependencySourceType.Remote];
declare const DEFAULT_WORKSPACE_MARKERS: readonly ["package.json"];
/**
 * Version specifier used when a dependency source
 * does not expose a meaningful version constraint.
 *
 * Examples:
 * - git dependencies
 * - file dependencies
 * - workspace dependencies
 *
 * Adapters normalize those dependencies into a
 * DependencyRequirement using this specifier so
 * the workflow can operate on a consistent model.
 */
declare const IMPLICIT_VERSION_SPECIFIER = "*";
declare const UPGRADE_PLANNING_SUPPORTED_SOURCES: readonly [DependencySourceType.Tag, DependencySourceType.Version, DependencySourceType.Range, DependencySourceType.Alias];
declare const DEFAULT_DEPENDENCY_GRAPH_EXPANSION_KINDS: readonly [PackageDependencyKind.Production];

declare function createDependencyDeclarationKey(declaration: DependencyDeclaration): DependencyDeclarationKey;

declare function createDependencyId(dependency: Dependency): DependencyId;

declare function createDependencyRequirementKey(requirement: DependencyRequirement): DependencyRequirementKey;

interface CreateDependencyNodeIdOptions {
    identifier: string;
    version: string;
}
declare function createDependencyNodeId(options: CreateDependencyNodeIdOptions): DependencyNodeId;

type PackageIdentifierIndex = Map<Node, Set<PackageIdentifier>>;
interface BuildPackageIdentifierIndexOptions {
    tree: Node;
    dependencyRequirementAdapter: DependencyRequirementAdapter<ProjectDependencySourceType>;
}
interface BuildDependencyGraphOptions {
    packageIdentifierIndex: PackageIdentifierIndex;
}
interface LinkDependencyOptions {
    graph: DependencyGraph;
    dependencyIds: Iterable<DependencyNodeId>;
    dependentIds: Iterable<DependencyNodeId>;
}
declare class PackageLockDependencyGraphProvider implements LockDependencyGraphProvider {
    readonly type = ProjectDependencyLockFileType.PackageLock;
    build(options: BuildLockDependencyGraphProviderOptions): Promise<DependencyGraph>;
    private buildPackageIdentifierIndex;
    private buildDependencyGraph;
    private ensureDependencyGraphNodes;
    private linkDependencyGraphNodes;
}

declare class WorkspacePackageRegistry {
    private readonly packages;
    private readonly packageMap;
    constructor(packages: WorkspacePackage[]);
    findByName(name: string): WorkspacePackage | null;
    has(name: string): boolean;
}

declare class WorkspacePackageResolver {
    private readonly registry;
    constructor(registry: WorkspacePackageRegistry);
    resolve(packageName: string, versionSpecifier: string): DependencyResolution<ProjectDependencySourceType> | null;
    private createResolution;
    private createWorkspaceIdentifier;
}

declare enum UpgradeCandidateOrder {
    HighestFirst = "highest-first",
    LowestFirst = "lowest-first"
}
interface UpgradeCandidateProviderOptions {
    order: UpgradeCandidateOrder;
}
declare class UpgradeCandidateProvider {
    private options;
    constructor(options: UpgradeCandidateProviderOptions);
    getCandidates(context: UpgradePlanningContext): AsyncIterable<UpgradeCandidate>;
    private getSortedCandidateManifests;
}

declare class UpgradePlanner {
    private candidateProvider;
    private resolver;
    constructor(candidateProvider: UpgradeCandidateProvider, resolver: UpgradeCandidateResolver);
    plan(context: UpgradePlanningContext): Promise<UpgradeCandidateResolution>;
}

interface UpgradePlanExecutorOptions {
    contexts: UpgradePlanningContext[];
}
declare class UpgradePlanningExecutor {
    private planner;
    constructor(planner: UpgradePlanner);
    planAll(options: UpgradePlanExecutorOptions): Promise<UpgradePlanResolution[]>;
}

declare class DependencyUpgradePlanningEngine {
    private planningContextBuilder;
    private upgradePlanningExecutor;
    private remediation;
    constructor(planningContextBuilder: UpgradePlanningContextBuilder, upgradePlanningExecutor: UpgradePlanningExecutor, remediation: UpgradePlanningRemediation);
    analyze(options: AnalyzeDependencyUpgradePlanningOptions): Promise<DependencyUpgradePlanningResult>;
}

declare class DependencyGraphProviderFactory {
    private registryDependencyExpanderProvider;
    private packageLockDependencyGraphProvider;
    constructor(registryDependencyExpanderProvider: RegistryDependencyExpanderProvider, packageLockDependencyGraphProvider: PackageLockDependencyGraphProvider);
    createRegistryDependencyExpander(): RegistryDependencyExpander;
    createPackageLockDependencyGraphProvider(): PackageLockDependencyGraphProvider;
}

declare const SelfPackageMetadata: {
    name: string;
    version: string;
};

declare class ProjectPackageLockFileResolver implements ProjectDependencyLockFileResolver {
    readonly type = ProjectDependencyLockFileType.PackageLock;
    getLockFileName(): string;
    resolveLockFilePath(projectPath: string): string;
    exists(projectPath: string): boolean;
}

interface VulnerabilityAdvisoryProviderContext {
    cwd: string;
}
interface VulnerabilityAdvisoryProvider {
    getAdvisories(context: VulnerabilityAdvisoryProviderContext): Promise<VulnerabilityAdvisory[]>;
}

declare class VulnerabilityAggregator {
    aggregate(advisories: VulnerabilityAdvisory[]): Vulnerability[];
    private getHighestSeverity;
    private joinRanges;
    private getSeverityPriority;
    private createVulnerabilityId;
}

interface ProjectVulnerabilityProviderOptions {
    projectPath: string;
}
declare class ProjectVulnerabilityProvider {
    private advisoryProvider;
    private vulnerabilityAggregator;
    constructor(advisoryProvider: VulnerabilityAdvisoryProvider, vulnerabilityAggregator: VulnerabilityAggregator);
    getVulnerabilities(options: ProjectVulnerabilityProviderOptions): Promise<Vulnerability[]>;
}

declare const PackageManifestSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    dependencies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    peerDependencies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    optionalDependencies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    devDependencies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    engines: z.ZodOptional<z.ZodObject<{
        node: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    os: z.ZodOptional<z.ZodArray<z.ZodString>>;
    cpu: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
type RawPackageManifest = z.infer<typeof PackageManifestSchema>;

declare class PackageManifestAdapter {
    private dependencyRequirementAdapter;
    constructor(dependencyRequirementAdapter: RegistryDependencyRequirementAdapter);
    normalize(manifest: RawPackageManifest): PackageManifest;
    private filterWorkspaceDependencies;
    private normalizeDependencies;
}

declare class PacoteManifestAdapter {
    private adapter;
    constructor(adapter: PackageManifestAdapter);
    normalize(manifest: Manifest): RegistryPackageManifest;
}

declare class PacotePackumentAdapter {
    private manifestAdapter;
    constructor(manifestAdapter: PacoteManifestAdapter);
    normalize(packument: Packument): RegistryPackagePackument;
    private normalizeVersions;
    private normalizeTime;
    private normalizeDistTags;
    private buildVersionDistTags;
}

declare class ProjectDependencyRequirementAdapter implements DependencyRequirementAdapter<ProjectDependencySourceType> {
    private readonly workspaceResolver;
    private readonly registryAdapter;
    private readonly specifierParser;
    constructor(workspaceResolver: WorkspacePackageResolver, registryAdapter: RegistryDependencyRequirementAdapter, specifierParser: WorkspaceDependencySpecifierParser);
    normalize(packageName: string, packageSpecifier: string): DependencyResolution<ProjectDependencySourceType>;
}

interface PacotePackageMetadataProviderOptions {
    manifestAdapter: PacoteManifestAdapter;
    packumentAdapter: PacotePackumentAdapter;
}
/***
why cast here ?
pacote types do not narrow on fullMetadata=true
***/
declare class PacotePackageMetadataProvider implements RegistryPackageMetadataProvider {
    private options;
    private pacoteOptions;
    constructor(options: PacotePackageMetadataProviderOptions);
    getPackument(packageName: string): Promise<RegistryPackagePackument>;
    resolvePackageManifest(options: ResolvePackageManifestOptions): Promise<RegistryPackageManifest>;
}

declare class ArboristVulnerabilityAdvisoryProvider implements VulnerabilityAdvisoryProvider {
    getAdvisories(context: VulnerabilityAdvisoryProviderContext): Promise<VulnerabilityAdvisory[]>;
    private mapSeverity;
}

interface BuildUnresolvedSectionOptions<TReason> {
    unresolved: UpgradePlanningDependencyUnresolvedResult<TReason>[];
}
declare class UnresolvedSectionBuilder<TReason> {
    build(options: BuildUnresolvedSectionOptions<TReason>): UnresolvedEntry<TReason>[];
}

interface BuildUpgradeAnalysisSectionOptions<TUnresolvedReason> {
    upgradeAnalysis: DependencyUpgradeAnalysisResult<TUnresolvedReason>;
}
declare class UpgradeAnalysisSectionBuilder<TUnresolvedReason> {
    private upgradeableBuilder;
    private transparencyBuilder;
    private unresolvedBuilder;
    constructor(upgradeableBuilder: UpgradeableSectionBuilder, transparencyBuilder: TransparencySectionBuilder, unresolvedBuilder: UnresolvedSectionBuilder<TUnresolvedReason>);
    build(options: BuildUpgradeAnalysisSectionOptions<TUnresolvedReason>): UpgradeAnalysisSection<TUnresolvedReason>;
}

interface BuildLatestReportOptions {
    result: LatestAuditResult;
    projectDependencies: ProjectDependencies;
    context: DependencyAuditWorkflowContext;
}
declare class LatestReportBuilder {
    private metadataBuilder;
    private auditSectionBuilder;
    private upgradeAnalysisSectionBuilder;
    private projectDependenciesSectionBuilder;
    constructor(metadataBuilder: ReportMetadataBuilder, auditSectionBuilder: AuditSectionBuilder, upgradeAnalysisSectionBuilder: UpgradeAnalysisSectionBuilder<LatestUnresolvedResultReason>, projectDependenciesSectionBuilder: ProjectDependenciesSectionBuilder);
    build(options: BuildLatestReportOptions): LatestReport;
}

interface BuildVulnerabilitySectionOptions {
    vulnerabilityAnalysis: DependencyVulnerabilityAnalysisResult;
}
declare class VulnerabilitySectionBuilder {
    build(options: BuildVulnerabilitySectionOptions): VulnerabilitySection;
    private buildChains;
}

interface BuildSecurityReportOptions {
    result: SecurityAuditResult;
    projectDependencies: ProjectDependencies;
    context: DependencyAuditWorkflowContext;
}
declare class SecurityReportBuilder {
    private metadataBuilder;
    private auditSectionBuilder;
    private upgradeAnalysisSectionBuilder;
    private projectDependenciesSectionBuilder;
    private vulnerabilitySectionBuilder;
    constructor(metadataBuilder: ReportMetadataBuilder, auditSectionBuilder: AuditSectionBuilder, upgradeAnalysisSectionBuilder: UpgradeAnalysisSectionBuilder<SecurityUnresolvedResultReason>, projectDependenciesSectionBuilder: ProjectDependenciesSectionBuilder, vulnerabilitySectionBuilder: VulnerabilitySectionBuilder);
    build(options: BuildSecurityReportOptions): SecurityReport;
    private assertSecurityReportConsistency;
}

declare class JsonReportRenderer<TReport extends AuditReport> implements ReportRenderer<TReport> {
    constructor();
    render(report: TReport): Promise<string>;
}

declare function renderSection(title: string, content: string): string;
declare function formatSectionTitle(title: string): string;
declare function renderTable(title: string, headers: string[], rows: string[][]): string;
declare function formatTableTitle(title: string): string;
declare function formatDate(timestampMs: number | null): string;

interface VulnerabilityUpgradeableRootDependency {
    rootDependency: SupportedRootDependencyVulnerabilityEntry;
    upgradeable: UpgradeableEntry;
}
interface VulnerabilityUnresolvedRootDependency {
    rootDependency: SupportedRootDependencyVulnerabilityEntry;
    unresolved: UnresolvedEntry<SecurityUnresolvedResultReason>;
}
declare class VulnerabilityReportUtils {
    static getSupportedRootDependencies(vulnerability: VulnerabilityEntry, report: SecurityReport): SupportedRootDependencyVulnerabilityEntry[];
    static getUnsupportedRootDependencies(vulnerability: VulnerabilityEntry, report: SecurityReport): UnsupportedRootDependencyVulnerabilityEntry[];
    static getRemovableDependency(vulnerability: VulnerabilityEntry, report: SecurityReport): RemovableDependencyVulnerabilityEntry | null;
    static getUpgradeableRootDependencies(vulnerability: VulnerabilityEntry, report: SecurityReport): VulnerabilityUpgradeableRootDependency[];
    static getUnresolvedRootDependencies(vulnerability: VulnerabilityEntry, report: SecurityReport): VulnerabilityUnresolvedRootDependency[];
    static canFullyRemediate(vulnerability: VulnerabilityEntry, report: SecurityReport): boolean;
}

interface ConsoleContentWriterOptions {
    stream: NodeJS.WritableStream;
}
declare class ConsoleContentWriter implements ContentWriter {
    private options;
    constructor(options: ConsoleContentWriterOptions);
    write(content: string): Promise<void>;
}

interface ConsoleReportOptions {
    format: ReportFormat.Console;
    showTransparency: boolean;
}
interface JsonReportOptions {
    format: ReportFormat.Json;
}
type ReportOptions = ConsoleReportOptions | JsonReportOptions;
interface AuditOptions {
    projectDirPatterns: string[];
    report: ReportOptions;
    allowExternalSources: boolean;
    includePrerelease: boolean;
    minimumReleaseAge: StringValue;
    useLockFile: boolean;
    workspacePackageManager: WorkspacePackageManagerType;
    followTransitiveDependencyRequirementKinds: PackageDependencyKind[];
}
interface AuditRuntimeContext {
    projectDirPatterns: string[];
    projectDependencyTreeSourceType: ProjectDependencyTreeSourceType;
    disallowedDependencySources: DependencySourceType[];
    projectDependencyRequirementConfiguration: ProjectDependencyRequirementConfiguration;
}
interface AuditRuntimeOptions {
    workflow: CreateDependencyAuditWorkflowOptions;
    reportWriter: CreateReportWriterOptions;
    projectDirectoryResolver: CreateProjectDirectoryResolverOptions;
    context: AuditRuntimeContext;
}
interface AuditApplicationContext<TReport extends AuditReport> {
    workflow: DependencyAuditWorkflow<TReport>;
    reportWriter: ReportWriter<TReport>;
    projectDirectoryResolver: ProjectDirectoryResolver;
    runtime: AuditRuntimeContext;
}
interface SecurityAuditOptions extends AuditOptions {
    type: AuditType.Security;
}
interface LatestAuditOptions extends AuditOptions {
    type: AuditType.Latest;
}
declare enum AuditType {
    Security = "security",
    Latest = " latest"
}
declare enum WorkspacePackageManagerType {
    None = "none",
    Npm = "npm"
}

declare const AuditCliOptionsSchema: z.ZodObject<{
    project: z.ZodArray<z.ZodString>;
    outputFormat: z.ZodEnum<typeof ReportFormat>;
    showTransparency: z.ZodOptional<z.ZodBoolean>;
    allowExternalSources: z.ZodDefault<z.ZodBoolean>;
    includePrerelease: z.ZodDefault<z.ZodBoolean>;
    useLockFile: z.ZodDefault<z.ZodBoolean>;
    minimumReleaseAge: z.ZodString;
    workspacePackageManager: z.ZodEnum<typeof WorkspacePackageManagerType>;
    followTransitiveDependencies: z.ZodArray<z.ZodEnum<typeof PackageDependencyKind>>;
}, z.core.$strip>;
type AuditCliOptions = z.infer<typeof AuditCliOptionsSchema>;

declare function buildAuditRuntimeOptions(options: AuditOptions): AuditRuntimeOptions;
declare function buildSecurityAuditApplicationContext(options: AuditRuntimeOptions): Promise<AuditApplicationContext<SecurityReport>>;
declare function buildLatestAuditApplicationContext(options: AuditRuntimeOptions): Promise<AuditApplicationContext<LatestReport>>;
declare function buildAuditOptions(options: AuditCliOptions): AuditOptions;

declare function auditCommand<TReport extends AuditReport>(context: AuditApplicationContext<TReport>): Promise<void>;

interface FindWorkspaceRootOptions {
    cwd: string;
    markers: string[];
}
declare function resolveRuntimeEnvironment(): RuntimeEnvironment;
declare function findWorkspaceRoot(options: FindWorkspaceRootOptions): string | null;
declare function resolveProjectDependencyRequirementConfiguration(workspacePackageManager: WorkspacePackageManagerType): ProjectDependencyRequirementConfiguration;

declare function runSecurityAudit(options: AuditCliOptions): Promise<void>;
declare function runLatestAudit(options: AuditCliOptions): Promise<void>;

declare function validateAuditCliOptions(options: AuditCliOptions): void;
declare function warnAuditOptions(options: AuditOptions): void;
declare function warnFollowTransitiveDependencyKindsAuditOptions(options: AuditOptions): void;
declare function validateReportOptions(options: AuditCliOptions): void;
declare function validateFollowTransitiveDependencyKinds(options: AuditCliOptions): void;

interface RuntimeCompatibilityResult {
    compatible: boolean;
    requiredRange: string | null;
    currentRuntime: RuntimeEnvironment;
}
declare class RuntimeCompatibilityChecker {
    private runtime;
    constructor(runtime: RuntimeEnvironment);
    supports(manifest: PackageManifest): RuntimeCompatibilityResult;
    private getRequiredRange;
}

interface DependencyTreeEngineEvaluatorOptions {
}
interface EngineViolation {
    packageName: string;
    packageVersion: string;
    requiredEngineVersion: string;
}
declare class DependencyTreeEngineEvaluator implements UpgradeEvaluator {
    private compatibilityChecker;
    readonly name = "dependency-tree-engine";
    constructor(compatibilityChecker: RuntimeCompatibilityChecker);
    evaluate(context: UpgradeEvaluationContext): Promise<EvaluatorDiagnostics>;
}

declare class DeprecatedPackageEvaluator implements UpgradeEvaluator {
    readonly name = "deprecated-package";
    constructor();
    evaluate(context: UpgradeEvaluationContext): Promise<EvaluatorDiagnostics>;
}

interface ReleaseAgeEvaluatorOptions {
    minimumAgeMs: number;
}
declare class ReleaseAgeEvaluator implements UpgradeEvaluator {
    private options;
    readonly name = "release-age";
    constructor(options: ReleaseAgeEvaluatorOptions);
    evaluate(context: UpgradeEvaluationContext): Promise<EvaluatorDiagnostics>;
}

declare class StableReleaseEvaluator implements UpgradeEvaluator {
    readonly name = "stable-release";
    evaluate(context: UpgradeEvaluationContext): Promise<EvaluatorDiagnostics>;
}

interface ResolveVulnerableDependencyNodesOptions {
    tree: DependencyTree;
    vulnerabilities: Vulnerability[];
}
declare class VulnerableDependencyNodeResolver {
    private chainResolver;
    constructor(chainResolver: DependencyChainResolver);
    resolve(options: ResolveVulnerableDependencyNodesOptions): VulnerableDependency[];
    private isNodeVulnerable;
}

interface ClassifyVulnerabilityReachabilityOptions {
    roots: Dependency[];
    vulnerabilities: VulnerableDependency[];
}
declare class VulnerabilityReachabilityClassifier {
    classify(options: ClassifyVulnerabilityReachabilityOptions): VulnerabilityRootReachabilityClassification;
    private resolveReachableRoots;
}

interface AnalyzeReachableVulnerabilitiesOptions {
    tree: DependencyTree;
    roots: Dependency[];
    vulnerabilities: Vulnerability[];
}
declare class ReachableVulnerabilityAnalyzer {
    private vulnerableDependencyNodeResolver;
    private vulnerabilityReachabilityClassifier;
    constructor(vulnerableDependencyNodeResolver: VulnerableDependencyNodeResolver, vulnerabilityReachabilityClassifier: VulnerabilityReachabilityClassifier);
    analyze(options: AnalyzeReachableVulnerabilitiesOptions): VulnerabilityRootReachabilityClassification;
}

interface ClassifyReachableVulnerabilitiesOptions {
    reachable: ReachableRootDependencyVulnerability[];
    supportedDependencies: RegistryDependency[];
}
declare class ReachableVulnerabilitySupportClassifier {
    classify(options: ClassifyReachableVulnerabilitiesOptions): ReachableVulnerabilitySupportClassification;
}

interface AnalyzeVulnerabilitiesOptions {
    dependencies: Dependency[];
    supportedDependencies: RegistryDependency[];
    vulnerabilities: Vulnerability[];
    originalTree: DependencyTree;
}
declare class VulnerabilityAnalyzer {
    private analyzer;
    private supportClassifier;
    constructor(analyzer: ReachableVulnerabilityAnalyzer, supportClassifier: ReachableVulnerabilitySupportClassifier);
    analyze(options: AnalyzeVulnerabilitiesOptions): VulnerabilityAnalysisResult;
}

declare class VulnerabilityReachabilityCollector {
    private reachable;
    private unreachable;
    addReachable(root: Dependency, vulnerability: VulnerableDependency): void;
    addUnreachable(vulnerability: VulnerableDependency): void;
    build(): VulnerabilityRootReachabilityClassification;
    private ensureReachableRoot;
}

interface UpgradeUnresolvedReasonResolver<TReason> {
    resolve(reason: UpgradePlanningFailureReason): TReason;
}

interface ClassifyDependencyUpgradeAnalysisOptions {
    planning: DependencyUpgradePlanningResult;
    originalTree: DependencyTree;
}
declare class DependencyUpgradeAnalysisClassifier<TUnresolvedReason> {
    private upgradeableAnalyzer;
    private reasonResolver;
    constructor(upgradeableAnalyzer: DependencyUpgradeableAnalyzer, reasonResolver: UpgradeUnresolvedReasonResolver<TUnresolvedReason>);
    classify(options: ClassifyDependencyUpgradeAnalysisOptions): Promise<DependencyUpgradeAnalysisResult<TUnresolvedReason>>;
}

interface BuildLatestAuditResultOptions {
    engine: DependencyUpgradePlanningResult;
    originalTree: DependencyTree;
}
declare class LatestAuditResultAssembler {
    private upgradeClassifier;
    constructor(upgradeClassifier: DependencyUpgradeAnalysisClassifier<LatestUnresolvedResultReason>);
    build(options: BuildLatestAuditResultOptions): Promise<LatestAuditResult>;
}

declare class DependencyLatestAuditWorkflow implements DependencyAuditWorkflow<LatestReport> {
    private dependencyContextProvider;
    private upgradePlanningEngine;
    private auditResultAssembler;
    private reportBuilder;
    constructor(dependencyContextProvider: ProjectDependencyContextProvider, upgradePlanningEngine: DependencyUpgradePlanningEngine, auditResultAssembler: LatestAuditResultAssembler, reportBuilder: LatestReportBuilder);
    execute(ctx: DependencyAuditWorkflowContext): Promise<LatestReport>;
}

interface ClassifyDependencyVulnerabilityAnalysisOptions {
    analysis: VulnerabilityAnalysisResult;
}
declare class DependencyVulnerabilityAnalysisClassifier {
    classify(options: ClassifyDependencyVulnerabilityAnalysisOptions): DependencyVulnerabilityAnalysisResult;
}

interface BuildSecurityAuditResultOptions {
    vulnerabilityAnalysis: VulnerabilityAnalysisResult;
    originalTree: DependencyTree;
    engine: DependencyUpgradePlanningResult;
}
declare class SecurityAuditResultAssembler {
    private vulnerabilityClassifier;
    private upgradeClassifier;
    constructor(vulnerabilityClassifier: DependencyVulnerabilityAnalysisClassifier, upgradeClassifier: DependencyUpgradeAnalysisClassifier<SecurityUnresolvedResultReason>);
    build(options: BuildSecurityAuditResultOptions): Promise<SecurityAuditResult>;
}

interface BuildVulnerabilityRequirementsOptions {
    vulnerabilities: SupportedReachableVulnerability[];
}
declare class SecurityForbiddenRequirementBuilder {
    build(options: BuildVulnerabilityRequirementsOptions): DependencyRequirement[];
    private buildRequirements;
    private extractVulnerabilities;
}

declare class DependencySecurityAuditWorkflow implements DependencyAuditWorkflow<SecurityReport> {
    private dependencyContextProvider;
    private upgradePlanningEngine;
    private reportBuilder;
    private auditResultAssembler;
    private vulnerabilityProvider;
    private vulnerabilityAnalyzer;
    private forbiddenRequirementBuilder;
    constructor(dependencyContextProvider: ProjectDependencyContextProvider, upgradePlanningEngine: DependencyUpgradePlanningEngine, reportBuilder: SecurityReportBuilder, auditResultAssembler: SecurityAuditResultAssembler, vulnerabilityProvider: ProjectVulnerabilityProvider, vulnerabilityAnalyzer: VulnerabilityAnalyzer, forbiddenRequirementBuilder: SecurityForbiddenRequirementBuilder);
    execute(ctx: DependencyAuditWorkflowContext): Promise<SecurityReport>;
}

declare class LatestUnresolvedReasonResolver implements UpgradeUnresolvedReasonResolver<LatestUnresolvedResultReason> {
    private sharedResolver;
    constructor(sharedResolver: SharedUnresolvedReasonResolver);
    resolve(reason: UpgradePlanningFailureReason): LatestUnresolvedResultReason;
}

declare class SecurityUnresolvedReasonResolver implements UpgradeUnresolvedReasonResolver<SecurityUnresolvedResultReason> {
    private readonly sharedResolver;
    constructor(sharedResolver: SharedUnresolvedReasonResolver);
    resolve(reason: UpgradePlanningFailureReason): SecurityUnresolvedResultReason;
}

declare class PackageManifestAdapterError extends Error {
    manifest: RawPackageManifest;
    cause: Error;
    constructor(manifest: RawPackageManifest, cause: Error);
}

export { ActionSummarySectionRenderer, type AddedDependencyChange, type AnalyzeDependencyUnresolvedOptions, type AnalyzeDependencyUpgradeOptions, type AnalyzeDependencyUpgradePlanningOptions, type AnalyzeDependencyUpgradeTransparencyOptions, type AnalyzeDependencyUpgradeableOptions, type AnalyzeReachableVulnerabilitiesOptions, type AnalyzeVulnerabilitiesOptions, ArboristVulnerabilityAdvisoryProvider, type AttachDependencyOptions, type AttachManifestOptions, type AttachPackageOptions, type AuditApplicationContext, type AuditCliOptions, AuditCliOptionsSchema, type AuditOptions, type AuditReport, type AuditRuntimeContext, type AuditRuntimeOptions, type AuditSection, AuditSectionBuilder, AuditType, type BuildAuditSectionOptions, type BuildDependencyGraphOptions, type BuildDependencyTreeOptions, type BuildLatestAuditResultOptions, type BuildLatestReportOptions, type BuildLockDependencyGraphOptions, type BuildLockDependencyGraphProviderOptions, type BuildPackageIdentifierIndexOptions, type BuildProjectDependenciesSectionOptions, type BuildProjectDependencyContextOptions, type BuildRegistryDependencyGraphOptions, type BuildRegistryPackageMetadataOptions, type BuildReportMetadataOptions, type BuildSecurityAuditResultOptions, type BuildSecurityReportOptions, type BuildTransparencySectionOptions, type BuildUnresolvedSectionOptions, type BuildUpgradeAnalysisSectionOptions, type BuildUpgradeableSectionOptions, type BuildVulnerabilityRequirementsOptions, type BuildVulnerabilitySectionOptions, type BuildWorkspaceProjectDependencyRequirementAdapterOptions, CandidateDependencyTreeBuilder, type ChangedDependencyChange, type ClassifyDependencyUpgradeAnalysisOptions, type ClassifyDependencyVulnerabilityAnalysisOptions, type ClassifyProjectDependenciesOptions, type ClassifyReachableVulnerabilitiesOptions, type ClassifyVulnerabilityReachabilityOptions, type CollectProjectDependenciesOptions, ConsoleContentWriter, type ConsoleContentWriterFactoryOptions, type ConsoleContentWriterOptions, type ConsoleRendererFactoryOptions, type ConsoleReportOptions, ConsoleReportRenderer, type ConsoleReportRendererOptions, type ConstraintValidationDiagnostic, ConstraintValidationDiagnosticCode, type ConstraintValidationResult, type ContentWriter, ContentWriterFactory, type ContentWriterFactoryOptions, ContentWriterType, type CreateDependencyAuditContainerOptions, type CreateDependencyAuditWorkflowOptions, type CreateDependencyNodeIdOptions, type CreateProjectDependencyRequirementAdapterOptions, type CreateProjectDirectoryResolverOptions, type CreateReportWriterOptions, DEFAULT_DEPENDENCY_GRAPH_EXPANSION_KINDS, DEFAULT_WORKSPACE_MARKERS, type Dependency, type DependencyAuditContainer, type DependencyAuditWorkflow, type DependencyAuditWorkflowContext, type DependencyChain, type DependencyChainNode, type DependencyChainNodeEntry, DependencyChainResolver, type DependencyChangeNode, type DependencyDeclaration, type DependencyDeclarationKey, type DependencyEdge, type DependencyExpansionOptions, DependencyGraph, type DependencyGraphNode, DependencyGraphProviderFactory, type DependencyId, DependencyLatestAuditWorkflow, type DependencyNodeId, type DependencyRequirement, type DependencyRequirementAdapter, type DependencyRequirementKey, type DependencyRequirementSpecifier, type DependencyResolution, DependencySecurityAuditWorkflow, DependencySourceConstraintValidator, DependencySourceType, DependencyTransparencyAnalyzer, type DependencyTransparencyAnalyzerOptions, type DependencyTransparencyReport, DependencyTree, DependencyTreeAssembler, type DependencyTreeChangeAnalysis, type DependencyTreeDiff, DependencyTreeDiffer, DependencyTreeEngineEvaluator, type DependencyTreeEngineEvaluatorOptions, type DependencyTreeNode, DependencyTreeSession, DependencyTreeSessionProvider, DependencyTreeTransitionAnalyzer, DependencyUnresolvedAnalyzer, DependencyUnresolvedReasonResolver, type DependencyUnresolvedResult, DependencyUpgradeAnalysisClassifier, type DependencyUpgradeAnalysisResult, DependencyUpgradeAnalyzer, DependencyUpgradePlanningEngine, type DependencyUpgradePlanningResult, DependencyUpgradeTransparencyAnalyzer, type DependencyUpgradeableAnalysis, DependencyUpgradeableAnalyzer, type DependencyUpgradeableResult, type DependencyVersionChange, DependencyVulnerabilityAnalysisClassifier, type DependencyVulnerabilityAnalysisResult, DeprecatedPackageEvaluator, type DistTagMap, type DistTagName, EXTERNAL_DEPENDENCY_SOURCES, type EngineSpecifier, type EngineViolation, type EvaluatorDiagnostic, EvaluatorDiagnosticCode, EvaluatorDiagnosticSeverity, type EvaluatorDiagnostics, type EvaluatorResult, type ExecuteUpgradePlanningRemediationOptions, type ExpandDependenciesOptions, type ExpandGraphOptions, type FileContentWriterFactoryOptions, type FindWorkspaceRootOptions, ForbiddenDependencyConstraintValidator, type GetProjectDeclarationsOptions, type GetProjectPackageManifestAdapterOptions, type GetWorkspacePackagesOptions, IMPLICIT_VERSION_SPECIFIER, InMemoryRegistryPackagePackumentCache, type IsoDatetimeString, type JsonRendererFactoryOptions, type JsonReportOptions, JsonReportRenderer, type LatestAuditOptions, type LatestAuditResult, LatestAuditResultAssembler, type LatestReport, LatestReportBuilder, LatestUnresolvedReason, LatestUnresolvedReasonResolver, type LatestUnresolvedResultReason, type LinkDependencyOptions, type LockDependencyGraphProvider, type LockDependencyTreeBuildOptions, NpmWorkspacePackageProvider, type PackageDependency, PackageDependencyKind, PackageEngineKind, type PackageEngines, type PackageIdentifier, type PackageIdentifierIndex, PackageLockDependencyGraphProvider, type PackageManifest, PackageManifestAdapter, PackageManifestAdapterError, PackageManifestDependencySelector, type PackageManifestDependencySelectorOptions, PackageManifestSchema, PackageMetadataRegistry, type PackageName, type PackageResolutionCacheKey, type PackageTimeMap, type PackageVersion, type PackageVersionMap, PackumentVersionResolver, PacoteManifestAdapter, PacotePackageMetadataProvider, type PacotePackageMetadataProviderOptions, PacotePackumentAdapter, PlanningConstraintEngine, type PlanningConstraintEngineOptions, ProjectDependencies, type ProjectDependenciesSection, ProjectDependenciesSectionBuilder, type ProjectDependencyClassification, ProjectDependencyCollector, type ProjectDependencyContext, ProjectDependencyContextProvider, type ProjectDependencyContextProviderOptions, type ProjectDependencyDeclaration, ProjectDependencyDeclarations, type ProjectDependencyKind, type ProjectDependencyLockFileResolver, ProjectDependencyLockFileToWorkspaceProviderMapper, ProjectDependencyLockFileType, ProjectDependencyProvider, ProjectDependencyRequirementAdapter, type ProjectDependencyRequirementAdapterContext, ProjectDependencyRequirementAdapterFactory, ProjectDependencyRequirementAdapterProvider, type ProjectDependencyRequirementAdapterProviderOptions, ProjectDependencyRequirementAdapterProviderOptionsResolver, ProjectDependencyRequirementAdapterType, type ProjectDependencyRequirementConfiguration, ProjectDependencyRequirementConfigurationValidator, ProjectDependencyResolver, ProjectDependencySource, type ProjectDependencySourceType, ProjectDependencySupportClassifier, type ProjectDependencyTreeContext, ProjectDependencyTreeProvider, ProjectDependencyTreeSourceType, ProjectDirectoryResolver, type ProjectDirectoryResolverOptions, ProjectLockDependencyBuilderResolver, ProjectLockDependencyGraphBuilder, ProjectManifestReader, ProjectOnlyDependencyKind, type ProjectPackageDependency, ProjectPackageLockFileResolver, type ProjectPackageManifest, ProjectPackageManifestAdapter, ProjectPackageManifestAdapterProvider, ProjectPackageManifestSchema, ProjectRegistryDependencyGraphBuilder, ProjectVulnerabilityProvider, type ProjectVulnerabilityProviderOptions, type ProvideDependencyGraphOptions, type RawPackageManifest, type RawProjectPackageManifest, type ReachableRootDependencyVulnerability, ReachableVulnerabilityAnalyzer, type ReachableVulnerabilitySupportClassification, ReachableVulnerabilitySupportClassifier, type ReadProjectManifestOptions, type RegistryDependency, RegistryDependencyExpander, RegistryDependencyExpanderProvider, RegistryDependencyRequirementAdapter, type RegistryDependencyTreeBuildOptions, type RegistryPackageInfo, type RegistryPackageManifest, RegistryPackageManifestResolver, type RegistryPackageMetadata, RegistryPackageMetadataBuilder, type RegistryPackageMetadataProvider, type RegistryPackagePackument, type RegistryProjectDependencyRequirementAdapterProviderOptions, type RegistryProjectDependencyRequirementConfiguration, ReleaseAgeEvaluator, type ReleaseAgeEvaluatorOptions, type RemovableDependencyVulnerabilityEntry, type RemovableVulnerabilityReport, type RemovedDependencyChange, type Report, ReportFormat, ReportInformationSectionRenderer, type ReportMetadata, ReportMetadataBuilder, type ReportOptions, type ReportRenderer, ReportRendererFactory, type ReportRendererFactoryOptions, ReportType, ReportWriter, type ResolveChainsContext, type ResolvePackageManifestOptions, type ResolvePackageOptions, type ResolvePackumentVersionOptions, type ResolveProjectDependenciesOptions, type ResolveRegistryPackageManifestOptions, type ResolveSharedUnresolvedReasonOptions, type ResolveUpgradeCandidateOptions, type ResolveVulnerableDependencyNodesOptions, ResolvedProjectDependencies, type ResolvedProjectDependency, RuntimeCompatibilityChecker, type RuntimeCompatibilityResult, type RuntimeEnvironment, type SecurityAuditOptions, type SecurityAuditResult, SecurityAuditResultAssembler, SecurityForbiddenRequirementBuilder, type SecurityReport, SecurityReportBuilder, SecurityUnresolvedReason, SecurityUnresolvedReasonResolver, type SecurityUnresolvedResultReason, SelectedPackageDependencies, SelfPackageMetadata, SharedUnresolvedReason, SharedUnresolvedReasonResolver, StableReleaseEvaluator, SummarySectionRenderer, type SupportedProjectDependency, type SupportedProjectDependencyEntry, type SupportedReachableVulnerability, type SupportedRootDependencyVulnerabilityEntry, type SupportedRootDependencyVulnerabilityReport, type ToDependencyChainOptions, TransparencyChangeType, type TransparencyDependency, type TransparencyEntry, TransparencySectionBuilder, TransparencySectionRenderer, UPGRADE_PLANNING_SUPPORTED_SOURCES, type UnresolvedEntry, UnresolvedSectionBuilder, UnsupportedProjectDependenciesSectionRenderer, type UnsupportedProjectDependency, type UnsupportedProjectDependencyEntry, UnsupportedProjectDependencyReason, type UnsupportedReachableVulnerability, type UnsupportedRootDependencyVulnerabilityEntry, type UnsupportedRootDependencyVulnerabilityReport, type UpgradeAnalysisSection, UpgradeAnalysisSectionBuilder, type UpgradeCandidate, UpgradeCandidateOrder, UpgradeCandidateProvider, type UpgradeCandidateProviderOptions, type UpgradeCandidateResolution, UpgradeCandidateResolver, type UpgradeEvaluationContext, type UpgradeEvaluationDiagnostics, UpgradeEvaluationEngine, type UpgradeEvaluationOptions, UpgradeEvaluationPipeline, UpgradeEvaluationPolicy, type UpgradeEvaluationPolicyOptions, type UpgradeEvaluationResult, type UpgradeEvaluator, UpgradeEvaluatorFactory, type UpgradeEvaluatorFactoryOptions, type UpgradePlanExecutorOptions, type UpgradePlanResolution, UpgradePlanner, type UpgradePlanningContext, type UpgradePlanningContextBuildOptions, UpgradePlanningContextBuilder, type UpgradePlanningDependencyUnresolvedResult, UpgradePlanningExecutor, UpgradePlanningFailureReason, type UpgradePlanningPolicy, UpgradePlanningRemediation, type UpgradeUnresolvedReasonResolver, UpgradeableDependenciesSectionRenderer, type UpgradeableEntry, UpgradeableSectionBuilder, type ValidateDependencySourcesOptions, type ValidateForbiddenDependenciesOptions, type ValidateProjectDependencyRequirementConfigurationOptions, type VersionDistTagMap, type Vulnerability, type VulnerabilityAdvisory, type VulnerabilityAdvisoryEntry, type VulnerabilityAdvisoryProvider, type VulnerabilityAdvisoryProviderContext, VulnerabilityAggregator, type VulnerabilityAnalysisResult, VulnerabilityAnalyzer, VulnerabilityDependencyRemovableReason, VulnerabilityDependencyUnsupportedReason, type VulnerabilityEntry, VulnerabilityReachabilityClassifier, VulnerabilityReachabilityCollector, VulnerabilityReportUtils, type VulnerabilityRootReachabilityClassification, type VulnerabilitySection, VulnerabilitySectionBuilder, VulnerabilitySectionRenderer, VulnerabilitySeverity, type VulnerabilitySeverityCounts, type VulnerabilityUnresolvedRootDependency, type VulnerabilityUpgradeableRootDependency, type VulnerableDependency, VulnerableDependencyNodeResolver, type WorkspaceDependencySpecifier, WorkspaceDependencySpecifierParser, type WorkspacePackage, WorkspacePackageManagerType, type WorkspacePackageProvider, WorkspacePackageProviderFactory, WorkspacePackageRegistry, WorkspacePackageResolver, type WorkspaceProjectDependencyRequirementAdapterProviderOptions, type WorkspaceProjectDependencyRequirementConfiguration, WorkspaceProviderType, auditCommand, buildAuditOptions, buildAuditRuntimeOptions, buildLatestAuditApplicationContext, buildSecurityAuditApplicationContext, createDependencyAuditContainer, createDependencyDeclarationKey, createDependencyId, createDependencyLatestAuditWorkflow, createDependencyNodeId, createDependencyRequirementKey, createDependencySecurityAuditWorkflow, createLatestCommand, createProjectDirectoryResolver, createReportWriter, createSecurityCommand, findWorkspaceRoot, formatDate, formatSectionTitle, formatTableTitle, renderSection, renderTable, resolveProjectDependencyRequirementConfiguration, resolveRuntimeEnvironment, runLatestAudit, runSecurityAudit, validateAuditCliOptions, validateFollowTransitiveDependencyKinds, validateReportOptions, warnAuditOptions, warnFollowTransitiveDependencyKindsAuditOptions };
