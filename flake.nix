{
  description = "GoGolb blog dev shell";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          nodejs_22 # astro (npm run dev / build)
          rsync openssh # deploy.sh, scripts/sync-skins.sh
        ];
      };
    };
}
