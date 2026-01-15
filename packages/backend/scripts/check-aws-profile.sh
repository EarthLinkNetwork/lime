#!/bin/bash
# AWS Profile Safety Check
# このスクリプトは berry profile 以外でのデプロイを防止します

REQUIRED_PROFILE="berry"

# 環境変数のチェック
if [ -n "$AWS_PROFILE" ] && [ "$AWS_PROFILE" != "$REQUIRED_PROFILE" ]; then
    echo "=============================================="
    echo "ERROR: Wrong AWS Profile!"
    echo "=============================================="
    echo "Current:  AWS_PROFILE=$AWS_PROFILE"
    echo "Required: AWS_PROFILE=$REQUIRED_PROFILE"
    echo ""
    echo "このプロジェクトは必ず '$REQUIRED_PROFILE' profile を使用してください。"
    echo ""
    echo "修正方法:"
    echo "  export AWS_PROFILE=$REQUIRED_PROFILE"
    echo "  または"
    echo "  unset AWS_PROFILE"
    echo "=============================================="
    exit 1
fi

# 正常
echo "AWS Profile check passed: using '$REQUIRED_PROFILE'"
exit 0
